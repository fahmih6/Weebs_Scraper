/**
 Parse Anoboy Archive Video Link Manually. */
function parseAnoboyArchiveVideoLink(stringData) {
  /// Split script string by "|"
  const splittedString = stringData.split("|");

  /// Get the 3rd String
  const scriptFunc = splittedString[2].split(",");

  /// Link Pattern
  const linkPattern = scriptFunc[4]
    .substring(4, scriptFunc[4].length)
    .replaceAll('"', "")
    .replaceAll("}", "")
    .replaceAll("]", "");

  /// Remove unnecessary data
  splittedString.splice(0, 3);

  /// Reverse key value object
  const indexMapReversed = Object.fromEntries(
    Object.entries(anoboyLinkPatternIndexMap).map(([key, value]) => [
      value,
      key,
    ])
  );

  /// Loop through link pattern
  const linkPatternArray = Array.from(linkPattern);

  /// New Link String
  let linkString = "";

  /// Loop through link pattern
  for (const key in linkPatternArray) {
    if (Object.hasOwnProperty.call(linkPatternArray, key)) {
      const element = linkPatternArray[key];
      /// Check if keys is in the index map
      if (indexMapReversed.hasOwnProperty(element)) {
        const mapIndex = indexMapReversed[element];
        linkString += splittedString[parseInt(mapIndex)];
      } else {
        linkString += element;
      }
    }
  }

  /// Return video link string
  return linkString;
}

/**
 * Array Index Map
 */
const anoboyLinkPatternIndexMap = {
  0: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
  7: 8,
  8: 9,
  9: "a",
  10: "b",
  11: "c",
  12: "d",
  13: "e",
  14: "f",
  15: "g",
  16: "h",
  17: "i",
  18: "j",
  19: "k",
  20: "l",
  21: "m",
  22: "n",
  23: "o",
  24: "p",
  25: "q",
  26: "r",
  27: "s",
  28: "t",
  29: "u",
  30: "v",
  31: "w",
  32: "x",
  33: "y",
  34: "z",
  35: "A",
  36: "B",
  37: "C",
  38: "D",
  39: "E",
  40: "F",
  41: "G",
  42: "H",
  43: "I",
  44: "J",
  45: "K",
  46: "L",
  47: "M",
  48: "N",
  49: "O",
  50: "P",
  51: "Q",
  52: "R",
  53: "S",
  54: "T",
  55: "U",
  56: "V",
  57: "W",
  58: "X",
  59: "Y",
  60: "Z",
};

module.exports = { parseAnoboyArchiveVideoLink };
