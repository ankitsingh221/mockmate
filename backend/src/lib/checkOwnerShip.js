
export const checkOwnership = (interview, userId) => {
  return interview.userId.toString() === userId.toString();
};