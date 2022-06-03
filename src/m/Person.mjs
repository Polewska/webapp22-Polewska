/**
 * @fileOverview  The model class Person with property definitions, (class-level)
 *                check methods, setter methods, and the special methods saveAll
 *                and retrieveAll
 * @author Gerd Wagner
 */
import {
  cloneObject,
  isNonEmptyString,
  isPositiveInteger,
} from "../../lib/util.mjs";
import {
  NoConstraintViolation,
  MandatoryValueConstraintViolation,
  RangeConstraintViolation,
  UniquenessConstraintViolation,
  ReferentialIntegrityConstraintViolation,
} from "../../lib/errorTypes.mjs";

/**
 * The class Person
 * @class
 * @param {{personId: string, name: string}} [slots] -
 */
class Person {
  // using a single record parameter with ES6 function parameter destructuring
  constructor({ personId, name }) {
    // assign properties by invoking implicit setters
    this.personId = personId; // number (integer)
    this.name = name; // string
  }
  get personId() {
    return this._personId;
  }
  get name() {
    return this._name;
  }
  set personId(id) {
    const constraintViolation = Person.checkPersonIdAsId(id, this.constructor);
    if (constraintViolation instanceof NoConstraintViolation) {
      this._personId = parseInt(id);
    } else {
      throw constraintViolation;
    }
  }
  set name(n) {
    const validationResult = Person.checkName(n);
    if (validationResult instanceof NoConstraintViolation) {
      this._name = n;
    } else {
      throw validationResult;
    }
  }

  static checkPersonId(id) {
    if (!id) {
      return new NoConstraintViolation(); // may be optional as an IdRef
    } else {
      id = parseInt(id); // convert to integer
      if (isNaN(id) || !Number.isInteger(id) || id < 1) {
        return new RangeConstraintViolation(
          "The person ID must be a positive integer!"
        );
      } else {
        return new NoConstraintViolation();
      }
    }
  }
  static checkPersonIdAsId(id, DirectType) {
    if (!DirectType) DirectType = Person; // default
    // convert to integer
    id = parseInt(id);
    if (isNaN(id)) {
      return new MandatoryValueConstraintViolation(
        "A positive integer value for the Person ID is required!"
      );
    }
    var constraintViolation = Person.checkPersonId(id);
    if (constraintViolation instanceof NoConstraintViolation) {
      if (DirectType.instances[id]) {
        // convert to string if number
        constraintViolation = new UniquenessConstraintViolation(
          `There is already a ${DirectType.name} record with this person ID!`
        );
      } else {
        constraintViolation = new NoConstraintViolation();
      }
    }
    return constraintViolation;
  }
  static checkPersonIdAsIdRef(id) {
    var constraintViolation = Person.checkPersonId(id);
    if (constraintViolation instanceof NoConstraintViolation && id) {
      if (!Person.instances[String(id)]) {
        constraintViolation = new ReferentialIntegrityConstraintViolation(
          `There is no Person record with this Person ID! ${id} `
        );
      }
    }
    return constraintViolation;
  }

  static checkName(name) {
    if (!name) {
      return new MandatoryValueConstraintViolation("A Name must be provided!");
    } else if (!isNonEmptyString(name)) {
      return new RangeConstraintViolation("Name has to be a non-Empty string!");
    } else {
      return new NoConstraintViolation();
    }
  }

  toString() {
    return `Person{ persID: ${this.personId}, name: ${this.name} }`;
  }

  toJSON() {
    // is invoked by JSON.stringify
    var rec = {};
    for (const p of Object.keys(this)) {
      // remove underscore prefix
      if (p.charAt(0) === "_") rec[p.substr(1)] = this[p];
    }
    return rec;
  }
}
/****************************************************
 *** Class-level ("static") properties ***************
 *****************************************************/
// initially an empty collection (in the form of a map)
Person.instances = {};
Person.subtypes = [];

/**********************************************************
 ***  Class-level ("static") storage management methods ***
 **********************************************************/
/**
 *  Create a new Person record/object
 */
Person.add = function (slots) {
  var person = null;
  try {
    person = new Person(slots);
  } catch (e) {
    console.log(`${e.constructor.name}: ${e.message}`);
    person = null;
  }
  if (person) {
    Person.instances[person.personId] = person;
    console.log(`Saved: ${person.name}`);
  }
};
/**
 *  Update an existing person record/object
 */
Person.update = function ({ personId, name }) {
  const person = Person.instances[personId],
    objectBeforeUpdate = cloneObject(person);
  var noConstraintViolated = true,
    ending = "",
    updatedProperties = [];
  try {
    if (name && person.name !== name) {
      person.name = name;
      updatedProperties.push("name");
    }
  } catch (e) {
    console.log(`${e.constructor.name}: ${e.message}`);
    noConstraintViolated = false;
    // restore object to its state before updating
    Person.instances[personId] = objectBeforeUpdate;
  }
  if (noConstraintViolated) {
    if (updatedProperties.length > 0) {
      ending = updatedProperties.length > 1 ? "ies" : "y";
      console.log(
        `Propert${ending} ${updatedProperties.toString()} modified for person ${name}`
      );
    } else {
      console.log(`No property value changed for person ${name}!`);
    }
  }
};
/**
 *  Delete an person object/record
 *  Since the Movie-person association is unidirectional, a linear search on all
 *  movies is required for being able to delete the person from the movies' persons.
 */
Person.destroy = function (personId) {
  const person = Person.instances[personId];
  delete Person.instances[personId];
  //delte this person from subtype instances
  for (const Subtype of Person.subtypes) {
    if (personId in Subtype.instances) delete Subtype.instances[personId];
  }
  console.log(`Person ${person.name} deleted.`);
};
/**
 *  Load all person records and convert them to objects
 */
Person.retrieveAll = function () {
  var persons = {};
  if (!localStorage["person"]) localStorage["person"] = "{}";
  try {
    persons = JSON.parse(localStorage["person"]);
  } catch (e) {
    console.log("Error when reading from Local Storage\n" + e);
    persons = {};
  }
  for (const key of Object.keys(persons)) {
    try {
      // convert record to (typed) object
      Person.instances[key] = new Person(persons[key]);
    } catch (e) {
      console.log(
        `${e.constructor.name} while deserializing person ${key}: ${e.message}`
      );
    }
  }
  console.log(`${Object.keys(persons).length} person records loaded.`);
  // add all instances of all subtypes to Person.instances
  for (const Subtype of Person.subtypes) {
    Subtype.retrieveAll();
    for (const key of Object.keys(Subtype.instances)) {
      Person.instances[key] = Subtype.instances[key];
    }
  }
  console.log(`${Object.keys(Person.instances).length} Person records loaded.`);
};
/**
 *  Save all person objects as records
 */
Person.saveAll = function () {
  const persons = {};
  for (const key of Object.keys(Person.instances)) {
    const pers = Person.instances[key];
    // save only direct instances (no actors or directors)
    if (pers.constructor === Person) persons[key] = pers;
  }
  try {
    localStorage["person"] = JSON.stringify(persons);
    console.log(`${Object.keys(persons).length} people saved.`);
  } catch (e) {
    alert("Error when writing to Local Storage\n" + e);
  }
};

export default Person;
