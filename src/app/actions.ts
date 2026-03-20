"use server";

import { executeAIAction } from "@/lib/ai/service";
import {
  createPostRecord,
  deleteDraftRevisionRecord,
  deletePostRecord,
  getDraftArtifactsRecord,
  getRecentDeletedPostsRecord,
  getMyPostsRecord,
  permanentlyDeletePostRecord,
  recordDraftSourceRecord,
  restoreDeletedPostRecord,
  saveDraftRecord,
} from "@/lib/drafts/persistence";
import {
  RecordDraftSourceInput,
  RunAIActionInput,
  DraftSaveInput,
  SaveDraftOptions,
} from "@/types";

export async function runAIAction(input: RunAIActionInput) {
  return executeAIAction(input);
}

export async function createPostAction() {
  return createPostRecord();
}

export async function saveDraftAction(
  input: DraftSaveInput,
  options: SaveDraftOptions,
) {
  return saveDraftRecord(input, options);
}

export async function getMyPostsAction() {
  return getMyPostsRecord();
}

export async function getRecentDeletedPostsAction() {
  return getRecentDeletedPostsRecord();
}

export async function deletePostAction(postId: string) {
  return deletePostRecord(postId);
}

export async function restoreDeletedPostAction(postId: string) {
  return restoreDeletedPostRecord(postId);
}

export async function permanentlyDeletePostAction(postId: string) {
  return permanentlyDeletePostRecord(postId);
}

export async function deleteDraftRevisionAction(revisionId: string) {
  return deleteDraftRevisionRecord(revisionId);
}

export async function getDraftArtifactsAction(postId: string) {
  return getDraftArtifactsRecord(postId);
}

export async function recordDraftSourceAction(input: RecordDraftSourceInput) {
  return recordDraftSourceRecord(input);
}
