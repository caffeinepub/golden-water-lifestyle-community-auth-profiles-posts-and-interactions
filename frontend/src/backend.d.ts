import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Comment {
    id: bigint;
    content: string;
    author: Principal;
    timestamp: bigint;
    reports: bigint;
    postId: bigint;
}
export type ModerationStatus = {
    __kind__: "active";
    active: null;
} | {
    __kind__: "blocked";
    blocked: string;
} | {
    __kind__: "flagged";
    flagged: string;
};
export interface PostPage {
    nextPageStart?: bigint;
    posts: Array<Post>;
}
export interface Post {
    id: bigint;
    content: string;
    video?: ExternalBlob;
    author: Principal;
    timestamp: bigint;
    reports: bigint;
    image?: ExternalBlob;
}
export interface Profile {
    bio: string;
    username: string;
    preferences: string;
    isAdult: boolean;
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
    clearAllCommentReports(): Promise<void>;
    clearAllPostReports(): Promise<void>;
    clearCommentReports(commentId: bigint): Promise<boolean>;
    clearFlaggedPost(postId: bigint): Promise<boolean>;
    clearPostReports(postId: bigint): Promise<boolean>;
    createComment(postId: bigint, content: string): Promise<bigint>;
    createPost(content: string, image: ExternalBlob | null, video: ExternalBlob | null): Promise<bigint>;
    deleteComment(commentId: bigint): Promise<boolean>;
    deletePost(postId: bigint): Promise<boolean>;
    getBlockedPosts(): Promise<Array<bigint>>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComment(commentId: bigint): Promise<Comment | null>;
    getContentGuidelines(): Promise<string>;
    getFlaggedHateSpeechPosts(): Promise<Array<[bigint, ModerationStatus]>>;
    getModerationStatus(postId: bigint): Promise<ModerationStatus>;
    getPost(postId: bigint): Promise<Post | null>;
    getPostComments(postId: bigint): Promise<Array<Comment>>;
    getPostsPage(startIndex: bigint, pageSize: bigint): Promise<PostPage>;
    getReportedComments(): Promise<Array<Comment>>;
    getReportedCommentsAdminView(): Promise<Array<Comment>>;
    getReportedPosts(): Promise<Array<Post>>;
    getReportedPostsAdminView(): Promise<Array<Post>>;
    getUserProfile(user: Principal): Promise<Profile | null>;
    getUsernameFromPrincipal(user: Principal): Promise<string | null>;
    isCallerAdmin(): Promise<boolean>;
    isUserAdult(user: Principal): Promise<boolean>;
    manualBlockPost(postId: bigint): Promise<boolean>;
    removeCommentReaction(commentId: bigint): Promise<void>;
    removePostReaction(postId: bigint): Promise<void>;
    reportComment(commentId: bigint): Promise<boolean>;
    reportPost(postId: bigint): Promise<boolean>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    setCommentReaction(commentId: bigint, reactionType: ReactionType): Promise<void>;
    setPostReaction(postId: bigint, reactionType: ReactionType): Promise<void>;
    unblockPost(postId: bigint): Promise<boolean>;
    updateComment(commentId: bigint, content: string): Promise<boolean>;
    updatePost(postId: bigint, content: string, image: ExternalBlob | null, video: ExternalBlob | null): Promise<boolean>;
}
