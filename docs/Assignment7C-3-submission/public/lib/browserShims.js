/**
 * @fileOverview  Browser shims are extensions of built-in objects. Here, we extend
 * the built-in object "Array", representing a class, by adding two class-level
 * functions ("max" and "min"), and two instance-level functions ("clone" and "isEqualTo")
 *
 * @copyright Copyright 2014-2022 Gerd Wagner, Chair of Internet Technology,
 *   Brandenburg University of Technology, Germany.
 * @license The MIT License (MIT)
 * @author Gerd Wagner
 */
 /**
 * Compute the max/min of an array
 * Notice that "apply" requires a context object, which is not really used
 * in the case of a static function such as Math.max
 */
Array.max = function (array) {
  return Math.max.apply(Math, array);
};
Array.min = function (array) {
  return Math.min.apply(Math, array);
};
/**
 * Test if an array is equal to another one
 * (if they have the same length and are elementwise equal)
 */
Array.prototype.isEqualTo = function (a2) {
  return (this.length === a2.length) && this.every((el, i) => el === a2[i]);
};
