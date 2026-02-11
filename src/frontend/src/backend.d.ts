import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Image {
    data: Uint8Array;
    mimeType: string;
}
export interface Profile {
    bio: string;
    username: string;
    preferences: string;
    isAdult: boolean;
}
export interface Comment {
    id: bigint;
    content: string;
    author: Principal;
    timestamp: bigint;
    reports: bigint;
    postId: bigint;
}
export interface Post {
    id: bigint;
    content: string;
    author: Principal;
    timestamp: bigint;
    reports: bigint;
    image?: Image;
}
export enum ReactionType {
    sad = "sad",
    angry = "angry",
    like = "like",
    love = "love",
    laugh = "laugh"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearCommentReports(commentId: bigint): Promise<boolean>;
    clearPostReports(postId: bigint): Promise<boolean>;
    createComment(postId: bigint, content: string): Promise<bigint>;
    createPost(content: string, image: Image | null): Promise<bigint>;
    deleteComment(commentId: bigint): Promise<boolean>;
    deletePost(postId: bigint): Promise<boolean>;
    getAllPosts(): Promise<Array<Post>>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComment(commentId: bigint): Promise<Comment | null>;
    getContentGuidelines(): Promise<string>;
    getPost(postId: bigint): Promise<Post | null>;
    getPostComments(postId: bigint): Promise<Array<Comment>>;
    getReportedComments(): Promise<Array<Comment>>;
    getReportedPosts(): Promise<Array<Post>>;
    getUserProfile(user: Principal): Promise<Profile | null>;
    getUsernameFromPrincipal(user: Principal): Promise<string | null>;
    isCallerAdmin(): Promise<boolean>;
    isUserAdult(user: Principal): Promise<boolean>;
    removeCommentReaction(commentId: bigint): Promise<void>;
    removePostReaction(postId: bigint): Promise<void>;
    reportComment(commentId: bigint): Promise<boolean>;
    reportPost(postId: bigint): Promise<boolean>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    setCommentReaction(commentId: bigint, reactionType: ReactionType): Promise<void>;
    setPostReaction(postId: bigint, reactionType: ReactionType): Promise<void>;
    updateComment(commentId: bigint, content: string): Promise<boolean>;
    updatePost(postId: bigint, content: string, image: Image | null): Promise<boolean>;
}
