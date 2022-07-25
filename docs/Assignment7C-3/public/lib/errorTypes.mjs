/**
 * @fileOverview  Defines error export classes (also called "exception" export classes)
 * for property constraint violations
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 */

class ConstraintViolation {
  constructor( msg) {
    this.message = msg;
  }
}

class NoConstraintViolation extends ConstraintViolation {
  constructor( msg, v) {
    super( msg);
    if (v) this.checkedValue = v;
    this.message = "";
  }
}

class MandatoryValueConstraintViolation extends ConstraintViolation {
  constructor( msg) {
    super( msg);
  }
}

class RangeConstraintViolation extends ConstraintViolation {
  constructor( msg) {
    super( msg);
  }
}

class StringLengthConstraintViolation extends ConstraintViolation {
  constructor( msg) {
    super( msg);
  }
}

class IntervalConstraintViolation extends ConstraintViolation {
  constructor( msg) {
    super( msg);
  }
}

class PatternConstraintViolation extends ConstraintViolation {
  constructor( msg) {
    super( msg);
  }
}

class UniquenessConstraintViolation extends ConstraintViolation {
  constructor( msg) {
    super( msg);
  }
}

export { ConstraintViolation, NoConstraintViolation, MandatoryValueConstraintViolation,
  RangeConstraintViolation, StringLengthConstraintViolation, IntervalConstraintViolation,
  PatternConstraintViolation, UniquenessConstraintViolation };
