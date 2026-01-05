export const getWordCount = (text) => {
  // remove leading & trailing whitespaces
  //split by any whitespace character (space, newline, tab)
  //filter out empty strings to handle multiple spaces
  return text.trim().split(/\s+/).filter(Boolean).length;
};
