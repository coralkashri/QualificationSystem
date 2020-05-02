/**
 * @param regex - RegExp object expected
 * @param fromIndex - optional, 0 if undefined
 * @returns {number}
 *
 * @warning The returned index might not be right in several cases.
 * Example: "aRomeo Romeo".indexOfRegex(new RegExp("\\bromeo", 'gi')); The result will be 1 when it should be 7,
 * because indexOf will look for the first time the "romeo" appears, no matter if it is at the beginning of a word or not.
 */
String.prototype.regexIndexOf = function(regex, fromIndex) {
    fromIndex = fromIndex || 0;
    var str = this.substring(fromIndex);
    var match = str.match(regex);
    return match ? str.indexOf(match[0]) + fromIndex : -1;
};

/**
 * @param regex - RegExp object expected
 * @param fromIndex - optional, 0 if undefined
 * @returns {number}
 *
 * @warning The returned index might not be right in several cases.
 * Example: "aRomeo Romeo".indexOfRegex(new RegExp("\\bromeo", 'gi')); The result will be 1 when it should be 7,
 * because indexOf will look for the first time the "romeo" appears, no matter if it is at the beginning of a word or not.
 */
String.prototype.regexLastIndexOf = function(regex, fromIndex) {
    fromIndex = fromIndex || 0;
    var str = this.substring(fromIndex);
    var match = str.match(regex);
    return match ? str.lastIndexOf(match[match.length - 1]) : -1;
};