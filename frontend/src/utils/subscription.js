export const hasSubscription = (user) => Boolean(String(user?.knowledgePackage || '').trim())
