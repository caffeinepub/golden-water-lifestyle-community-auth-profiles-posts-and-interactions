import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type Profile = {
    username : Text;
    bio : Text;
    preferences : Text;
    isAdult : Bool;
  };

  type Post = {
    id : Nat;
    author : Principal;
    content : Text;
    timestamp : Int;
    reports : Nat;
    image : ?Storage.ExternalBlob;
    video : ?Storage.ExternalBlob;
  };

  type Comment = {
    id : Nat;
    postId : Nat;
    author : Principal;
    content : Text;
    timestamp : Int;
    reports : Nat;
  };

  type ReactionType = {
    #like;
    #love;
    #laugh;
    #sad;
    #angry;
  };

  type ModerationStatus = {
    #active;
    #blocked : Text;
    #flagged : Text;
  };

  type ModerationReason = {
    #illegalContent;
    #copyrightInfringement;
    #hateSpeech;
    #underageMaterial;
    #none;
  };

  // Original actor state type
  type OldActor = {
    profiles : Map.Map<Principal, Profile>;
    posts : Map.Map<Nat, Post>;
    comments : Map.Map<Nat, Comment>;
    postReactions : Map.Map<Nat, Map.Map<Principal, ReactionType>>;
    commentReactions : Map.Map<Nat, Map.Map<Principal, ReactionType>>;
    postIdCounter : Nat;
    commentIdCounter : Nat;
    moderationStates : Map.Map<Nat, ModerationStatus>;
    moderationReasons : Map.Map<Nat, ModerationReason>;
  };

  // New actor state type (same as old in this migration)
  type NewActor = OldActor;

  public func run(old : OldActor) : NewActor {
    // No state transformation needed for this migration!
    old;
  };
};
