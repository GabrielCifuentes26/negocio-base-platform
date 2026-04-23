type PostgrestLikeError = {
  code?: string | null;
  message?: string | null;
};

export function isMissingRpcError(error?: PostgrestLikeError | null) {
  if (!error) {
    return false;
  }

  if (error.code === "PGRST202") {
    return true;
  }

  const message = error.message?.toLowerCase() ?? "";

  return message.includes("could not find the function") || message.includes("function") && message.includes("not found");
}
