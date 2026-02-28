import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";

import Timer "mo:core/Timer";


actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type Profile = {
    username : Text;
    bio : Text;
    preferences : Text;
    isAdult : Bool;
  };

  public type Post = {
    id : Nat;
    author : Principal;
    content : Text;
    timestamp : Int;
    reports : Nat;
    image : ?Storage.ExternalBlob;
    video : ?Storage.ExternalBlob;
  };

  public type Comment = {
    id : Nat;
    postId : Nat;
    author : Principal;
    content : Text;
    timestamp : Int;
    reports : Nat;
  };

  public type ReactionType = {
    #like;
    #love;
    #laugh;
    #sad;
    #angry;
  };

  public type Reaction = {
    user : Principal;
    reactionType : ReactionType;
  };

  let profiles = Map.empty<Principal, Profile>();
  let posts = Map.empty<Nat, Post>();
  let comments = Map.empty<Nat, Comment>();
  let postReactions = Map.empty<Nat, Map.Map<Principal, ReactionType>>();
  let commentReactions = Map.empty<Nat, Map.Map<Principal, ReactionType>>();

  var postIdCounter = 0;
  var commentIdCounter = 0;

  public type ModerationStatus = {
    #active;
    #blocked : Text;
    #flagged : Text;
  };

  public type ModerationReason = {
    #illegalContent;
    #copyrightInfringement;
    #hateSpeech;
    #underageMaterial;
    #none;
  };

  let moderationStates = Map.empty<Nat, ModerationStatus>();
  let moderationReasons = Map.empty<Nat, ModerationReason>();

  // Paged results type for posts (can be used for comments if needed)
  public type PostPage = {
    posts : [Post];
    nextPageStart : ?Nat;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?Profile {
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  public query ({ caller }) func getUsernameFromPrincipal(user : Principal) : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access usernames");
    };
    switch (profiles.get(user)) {
      case (null) { null };
      case (?profile) { ?profile.username };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : Profile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profiles.add(caller, profile);
  };

  public query ({ caller }) func isUserAdult(user : Principal) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check adult status");
    };
    switch (profiles.get(user)) {
      case (null) { false };
      case (?profile) { profile.isAdult };
    };
  };

  // Public information - accessible to everyone including guests
  public query func getContentGuidelines() : async Text {
    "No hate speech, bullying, or illegal content. Respect each other and have fun! This is an adults-only service. By using this service you confirm that you are 18+ and agree to reject any illegal activity. Illegal activity will be reported to the authorities.";
  };

  func moderateContent(content : Text) : (Bool, ModerationReason, Text) {
    let lowerContent = content.toLower();

    // Check for underage material - automatic block
    if (lowerContent.contains(#text("underage")) or lowerContent.contains(#text("minor"))) {
      return (true, #underageMaterial, "Upload blocked: Contains underage explicit material.");
    };

    // Check for illegal content - automatic block
    if (lowerContent.contains(#text("illegal"))) {
      return (true, #illegalContent, "Upload blocked: Contains illegal content.");
    };

    // Check for copyright - automatic block on keyword match
    if (lowerContent.contains(#text("copyright")) or lowerContent.contains(#text("pirated"))) {
      return (true, #copyrightInfringement, "Upload blocked: Copyright violation detected.");
    };

    // Check for hate speech - FLAG but don't block (borderline cases)
    if (lowerContent.contains(#text("hate"))) {
      return (false, #hateSpeech, "Flagged for potential hate speech");
    };

    (false, #none, "Content is clean");
  };

  func isPostBlocked(postId : Nat) : Bool {
    switch (moderationStates.get(postId)) {
      case (null) { false };
      case (?status) {
        switch (status) {
          case (#blocked(_)) { true };
          case (_) { false };
        };
      };
    };
  };

  public shared ({ caller }) func createPost(
    content : Text,
    image : ?Storage.ExternalBlob,
    video : ?Storage.ExternalBlob,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };

    switch (profiles.get(caller)) {
      case (null) {
        Runtime.trap(
          "Profile not found. Please create a profile with 18+ acknowledgement first."
        );
      };
      case (?profile) {
        if (not profile.isAdult) {
          Runtime.trap(
            "You must acknowledge you are 18+ to create posts on this adults-only service."
          );
        };
      };
    };

    let (shouldBlock, reason, reasonText) = moderateContent(content);

    // Block if moderation says to block
    if (shouldBlock) {
      Runtime.trap(reasonText);
    };

    let postId = postIdCounter;
    postIdCounter += 1;

    let newPost : Post = {
      id = postId;
      author = caller;
      content;
      timestamp = Time.now();
      reports = 0;
      image;
      video;
    };

    posts.add(postId, newPost);

    // Set moderation state based on reason
    moderationStates.add(
      postId,
      switch (reason) {
        case (#hateSpeech) { #flagged("Flagged for potential hate speech") };
        case (_) { #active };
      },
    );
    moderationReasons.add(postId, reason);
    postReactions.add(postId, Map.empty<Principal, ReactionType>());
    postId;
  };

  public query ({ caller }) func getPost(postId : Nat) : async ?Post {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view posts");
    };

    // Non-admins cannot see blocked posts
    if (not (AccessControl.isAdmin(accessControlState, caller)) and isPostBlocked(postId)) {
      return null;
    };

    posts.get(postId);
  };

  // Paginated posts query, with window size and start index
  public query ({ caller }) func getPostsPage(startIndex : Nat, pageSize : Nat) : async PostPage {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view posts");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let filteredPosts : [Post] = posts.values().toArray().filter<Post>(
      func(post : Post) : Bool {
        isAdmin or not isPostBlocked(post.id);
      }
    );

    let totalPosts = filteredPosts.size();

    if (totalPosts == 0 or startIndex >= totalPosts) {
      return { posts = []; nextPageStart = null };
    };

    let windowEnd = Nat.min(totalPosts, startIndex + pageSize);
    if (startIndex >= windowEnd) {
      return { posts = []; nextPageStart = null };
    };

    let windowPosts = filteredPosts.sliceToArray(startIndex, windowEnd);
    let nextPage = if (windowEnd < totalPosts) { ?windowEnd } else { null };

    {
      posts = windowPosts;
      nextPageStart = nextPage;
    };
  };

  public shared ({ caller }) func updatePost(
    postId : Nat,
    content : Text,
    image : ?Storage.ExternalBlob,
    video : ?Storage.ExternalBlob,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update posts");
    };

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?post) {
        if (post.author != caller) {
          Runtime.trap("Unauthorized: Can only update your own posts");
        };

        // Non-admins cannot update blocked posts
        if (not (AccessControl.isAdmin(accessControlState, caller)) and isPostBlocked(postId)) {
          Runtime.trap("Cannot update blocked post");
        };

        // Re-check moderation on updated content
        let (shouldBlock, reason, reasonText) = moderateContent(content);

        if (shouldBlock) {
          Runtime.trap(reasonText);
        };

        let updatedPost = { post with content; image; video };
        posts.add(postId, updatedPost);

        // Update moderation state based on new content
        moderationStates.add(
          postId,
          switch (reason) {
            case (#hateSpeech) { #flagged("Flagged for potential hate speech") };
            case (_) { #active };
          },
        );
        moderationReasons.add(postId, reason);

        true;
      };
    };
  };

  public shared ({ caller }) func deletePost(postId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete posts");
    };

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?post) {
        if (post.author != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
          Runtime.trap("Unauthorized: Can only delete your own posts or be an admin");
        };
        posts.remove(postId);
        postReactions.remove(postId);
        moderationStates.remove(postId);
        moderationReasons.remove(postId);
        true;
      };
    };
  };

  public shared ({ caller }) func setPostReaction(postId : Nat, reactionType : ReactionType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can react to posts");
    };

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?_post) {
        // Non-admins cannot react to blocked posts
        if (not (AccessControl.isAdmin(accessControlState, caller)) and isPostBlocked(postId)) {
          Runtime.trap("Cannot react to blocked post");
        };

        switch (postReactions.get(postId)) {
          case (null) {
            let newReactions = Map.empty<Principal, ReactionType>();
            newReactions.add(caller, reactionType);
            postReactions.add(postId, newReactions);
          };
          case (?reactions) {
            let filtered = reactions.filter(func(entry) { entry.0 != caller });
            let newReactions = Map.empty<Principal, ReactionType>();
            filtered.entries().forEach(func(entry) { newReactions.add(entry.0, entry.1) });
            newReactions.add(caller, reactionType);
            postReactions.add(postId, newReactions);
          };
        };
      };
    };
  };

  public shared ({ caller }) func removePostReaction(postId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove reaction from posts");
    };

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?_post) {
        switch (postReactions.get(postId)) {
          case (null) {};
          case (?reactions) {
            let filtered = reactions.filter(func(entry) { entry.0 != caller });
            let newReactions = Map.empty<Principal, ReactionType>();
            filtered.entries().forEach(func(entry) { newReactions.add(entry.0, entry.1) });
            postReactions.add(postId, newReactions);
          };
        };
      };
    };
  };

  public shared ({ caller }) func createComment(postId : Nat, content : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create comments");
    };

    switch (profiles.get(caller)) {
      case (null) {
        Runtime.trap("Profile not found. Please create a profile with 18+ acknowledgement first.");
      };
      case (?profile) {
        if (not profile.isAdult) {
          Runtime.trap("You must acknowledge you are 18+ to create comments on this adults-only service.");
        };
      };
    };

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?_post) {
        // Non-admins cannot comment on blocked posts
        if (not (AccessControl.isAdmin(accessControlState, caller)) and isPostBlocked(postId)) {
          Runtime.trap("Cannot comment on blocked post");
        };

        let commentId = commentIdCounter;
        commentIdCounter += 1;

        let newComment : Comment = {
          id = commentId;
          postId;
          author = caller;
          content;
          timestamp = Time.now();
          reports = 0;
        };

        comments.add(commentId, newComment);
        commentReactions.add(commentId, Map.empty<Principal, ReactionType>());
        commentId;
      };
    };
  };

  public query ({ caller }) func getComment(commentId : Nat) : async ?Comment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view comments");
    };
    comments.get(commentId);
  };

  public query ({ caller }) func getPostComments(postId : Nat) : async [Comment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view comments");
    };
    comments.values().toArray().filter<Comment>(
      func(c : Comment) : Bool { c.postId == postId }
    );
  };

  public shared ({ caller }) func updateComment(commentId : Nat, content : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update comments");
    };

    switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment does not exist") };
      case (?comment) {
        if (comment.author != caller) {
          Runtime.trap("Unauthorized: Can only update your own comments");
        };
        let updatedComment = { comment with content };
        comments.add(commentId, updatedComment);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteComment(commentId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete comments");
    };

    switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment does not exist") };
      case (?comment) {
        if (comment.author != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
          Runtime.trap("Unauthorized: Can only delete your own comments or be an admin");
        };
        comments.remove(commentId);
        commentReactions.remove(commentId);
        true;
      };
    };
  };

  public shared ({ caller }) func setCommentReaction(commentId : Nat, reactionType : ReactionType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can react to comments");
    };

    switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment does not exist") };
      case (?_comment) {
        switch (commentReactions.get(commentId)) {
          case (null) {
            let newReactions = Map.empty<Principal, ReactionType>();
            newReactions.add(caller, reactionType);
            commentReactions.add(commentId, newReactions);
          };
          case (?reactions) {
            let filtered = reactions.filter(func(entry) { entry.0 != caller });
            let newReactions = Map.empty<Principal, ReactionType>();
            filtered.entries().forEach(func(entry) { newReactions.add(entry.0, entry.1) });
            newReactions.add(caller, reactionType);
            commentReactions.add(commentId, newReactions);
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeCommentReaction(commentId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove reaction from comments");
    };

    switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment does not exist") };
      case (?_comment) {
        switch (commentReactions.get(commentId)) {
          case (null) {};
          case (?reactions) {
            let filtered = reactions.filter(func(entry) { entry.0 != caller });
            let newReactions = Map.empty<Principal, ReactionType>();
            filtered.entries().forEach(func(entry) { newReactions.add(entry.0, entry.1) });
            commentReactions.add(commentId, newReactions);
          };
        };
      };
    };
  };

  public shared ({ caller }) func reportPost(postId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can report posts");
    };

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?post) {
        let updatedPost = { post with reports = post.reports + 1 };
        posts.add(postId, updatedPost);
        true;
      };
    };
  };

  public shared ({ caller }) func reportComment(commentId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can report comments");
    };

    switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment does not exist") };
      case (?comment) {
        let updatedComment = { comment with reports = comment.reports + 1 };
        comments.add(commentId, updatedComment);
        true;
      };
    };
  };

  public query ({ caller }) func getReportedPosts() : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view reported posts");
    };

    posts.values().toArray().filter<Post>(
      func(p : Post) : Bool { p.reports > 0 }
    );
  };

  public query ({ caller }) func getReportedComments() : async [Comment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view reported comments");
    };

    comments.values().toArray().filter<Comment>(
      func(c : Comment) : Bool { c.reports > 0 }
    );
  };

  public shared ({ caller }) func clearPostReports(postId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear reports");
    };

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?post) {
        let updatedPost = { post with reports = 0 };
        posts.add(postId, updatedPost);
        true;
      };
    };
  };

  public shared ({ caller }) func clearCommentReports(commentId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear reports");
    };

    switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment does not exist") };
      case (?comment) {
        let updatedComment = { comment with reports = 0 };
        comments.add(commentId, updatedComment);
        true;
      };
    };
  };

  public query ({ caller }) func getFlaggedHateSpeechPosts() : async [(Nat, ModerationStatus)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view flagged posts");
    };
    moderationStates.entries().toArray().filter<(
      Nat,
      ModerationStatus,
    )>(
      func(entry) {
        switch (entry.1) {
          case (#flagged(_)) { true };
          case (_) { false };
        };
      }
    );
  };

  public query ({ caller }) func getBlockedPosts() : async [Nat] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view blocked posts");
    };
    moderationStates.entries().toArray().filter<(
      Nat,
      ModerationStatus,
    )>(
      func(entry) { switch (entry.1) { case (#blocked(_)) { true }; case (_) { false } } }
    ).map<(Nat, ModerationStatus), Nat>(func(entry) { entry.0 });
  };

  public shared ({ caller }) func manualBlockPost(postId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can block posts");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?_post) {
        moderationStates.add(postId, #blocked("Manual copyright block"));
        true;
      };
    };
  };

  public shared ({ caller }) func unblockPost(postId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can unblock posts");
    };
    switch (moderationStates.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?status) {
        moderationStates.add(postId, #active);
        true;
      };
    };
  };

  public shared ({ caller }) func clearFlaggedPost(postId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear flagged posts");
    };
    switch (moderationStates.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?status) {
        switch (status) {
          case (#flagged(_)) {
            moderationStates.add(postId, #active);
            true;
          };
          case (_) {
            Runtime.trap("Post is not flagged");
          };
        };
      };
    };
  };

  public query ({ caller }) func getModerationStatus(postId : Nat) : async ModerationStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view moderation status");
    };
    switch (moderationStates.get(postId)) {
      case (null) { #active };
      case (?status) { status };
    };
  };

  public query ({ caller }) func getReportedPostsAdminView() : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access reported posts");
    };

    posts.values().toArray().filter<Post>(
      func(post) { post.reports > 0 }
    );
  };

  public query ({ caller }) func getReportedCommentsAdminView() : async [Comment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access reported comments");
    };

    comments.values().toArray().filter<Comment>(
      func(comment) { comment.reports > 0 }
    );
  };

  public shared ({ caller }) func clearAllPostReports() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear reports");
    };

    for ((postId, post) in posts.entries()) {
      if (post.reports > 0) {
        let updatedPost = { post with reports = 0 };
        posts.add(postId, updatedPost);
      };
    };
  };

  public shared ({ caller }) func clearAllCommentReports() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear reports");
    };

    for ((commentId, comment) in comments.entries()) {
      if (comment.reports > 0) {
        let updatedComment = { comment with reports = 0 };
        comments.add(commentId, updatedComment);
      };
    };
  };
};
