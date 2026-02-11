import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type Profile = {
    username : Text;
    bio : Text;
    preferences : Text;
    isAdult : Bool;
  };

  public type Image = {
    data : [Nat8];
    mimeType : Text;
  };

  public type Post = {
    id : Nat;
    author : Principal;
    content : Text;
    timestamp : Int;
    reports : Nat;
    image : ?Image;
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

  func validateImageSize(image : ?Image) {
    let maxSize = 10 * 1024 * 1024; // 10MB in bytes
    switch (image) {
      case (null) {};
      case (?img) {
        if (img.data.size() > maxSize) {
          Runtime.trap("Image size exceeds maximum allowed limit of 10MB.");
        };
      };
    };
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

  public query ({ caller }) func getContentGuidelines() : async Text {
    "No hate speech, bullying, or illegal content. Respect each other and have fun! This is an adults-only service. By using this service you confirm that you are 18+ and agree to reject any illegal activity. Illegal activity will be reported to the authorities.";
  };

  public shared ({ caller }) func createPost(content : Text, image : ?Image) : async Nat {
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

    validateImageSize(image);

    let postId = postIdCounter;
    postIdCounter += 1;

    let newPost : Post = {
      id = postId;
      author = caller;
      content;
      timestamp = Time.now();
      reports = 0;
      image;
    };

    posts.add(postId, newPost);
    postReactions.add(postId, Map.empty<Principal, ReactionType>());
    postId;
  };

  public query ({ caller }) func getPost(postId : Nat) : async ?Post {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view posts");
    };
    posts.get(postId);
  };

  public query ({ caller }) func getAllPosts() : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view posts");
    };
    posts.values().toArray();
  };

  public shared ({ caller }) func updatePost(postId : Nat, content : Text, image : ?Image) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update posts");
    };

    validateImageSize(image);

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?post) {
        if (post.author != caller) {
          Runtime.trap("Unauthorized: Can only update your own posts");
        };
        let updatedPost = { post with content; image };
        posts.add(postId, updatedPost);
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
};
