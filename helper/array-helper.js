function removeAllItemFrom(arr, startIndex) {
  var i = startIndex;
  var tempArr = arr;
  for (let index = 0; index < arr.length; index++) {
    if (index <= startIndex) {
      tempArr.shift();
    }
  }
  return tempArr;
}

function areEqual(array1, array2) {
  if (array1.length === array2.length) {
    return array1.every((element) => {
      if (array2.includes(element)) {
        return true;
      }

      return false;
    });
  }

  return false;
}

module.exports = { removeAllItemFrom, areEqual };
