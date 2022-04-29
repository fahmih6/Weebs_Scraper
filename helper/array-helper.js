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

module.exports = { removeAllItemFrom };
