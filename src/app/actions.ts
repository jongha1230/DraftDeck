"use server";

import { executeAIAction } from "@/lib/ai/service";
import {
  createPostRecord,
  deletePostRecord,
  getDraftArtifactsRecord,
  getMyPostsRecord,
  recordDraftSourceRecord,
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

export async function deletePostAction(postId: string) {
  return deletePostRecord(postId);
}

export async function getDraftArtifactsAction(postId: string) {
  return getDraftArtifactsRecord(postId);
}

export async function recordDraftSourceAction(input: RecordDraftSourceInput) {
  return recordDraftSourceRecord(input);
}
