/**
 * @fileOverview  The model class Director with attribute definitions, (class-level) check methods,
 *                setter methods, and the special methods saveAll and retrieveAll
 * @author Gerd Wagner
 * @copyright Copyright 2013-2014 Gerd Wagner, Chair of Internet Technology, Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */
import Person from "./Person.mjs";
import { cloneObject } from "../../lib/util.mjs";
import {
  NoConstraintViolation,
  ReferentialIntegrityConstraintViolation,
} from "../../lib/errorTypes.mjs";

/**
 * The class Director
 * @class
 */
class Director extends Person {
  // using a single record parameter with ES6 function parameter destructuring
  constructor({ personId, name }) {
    super({ personId, name }); // invoke Person constructor
  }
  static checkDirectorIdAsIdRef(id) {
    var constraintViolation = Person.checkPersonId(id);
    if (constraintViolation instanceof NoConstraintViolation && id) {
      if (!Director.instances[String(id)]) {
        constraintViolation = new ReferentialIntegrityConstraintViolation(
          `There is no Director record with this Director ID! ${id} `
        );
      }
    }
    return constraintViolation;
  }
  toString() {
    return `Director{ persID: ${this.personId}, name: ${this.name}}`;
  }
}
/*****************************************************
 *** Class-level ("static") properties ***************
 *****************************************************/
// initially an empty collection (in the form of a map)
Director.instances = {};
// add Director to the list of Person subtypes
Person.subtypes.push(Director);

/**********************************************************
 ***  Class-level ("static") storage management methods ***
 **********************************************************/
/**
 *  Create a new Director record
 */
Director.add = function (slots) {
  var director = null;
  try {
    director = new Director(slots);
  } catch (e) {
    console.log(`${e.constructor.name + ": " + e.message}`);
    director = null;
  }
  if (director) {
    Director.instances[director.personId] = director;
    console.log(`Saved: ${director.name}`);
  }
};
/**
 *  Update an existing Director record
 */
Director.update = function ({ personId, name }) {
  const director = Director.instances[personId],
    objectBeforeUpdate = cloneObject(director);
  var noConstraintViolated = true,
    updatedProperties = [];
  try {
    if (name && director.name !== name) {
      director.name = name;
      updatedProperties.push("name");
    }
  } catch (e) {
    console.log(e.constructor.name + ": " + e.message);
    noConstraintViolated = false;
    // restore object to its state before updating
    Director.instances[personId] = objectBeforeUpdate;
  }
  if (noConstraintViolated) {
    if (updatedProperties.length > 0) {
      console.log(
        `Property ${updatedProperties.toString()} modified for director ${name}`
      );
    } else {
      console.log(`No property value changed for director ${name}!`);
    }
  }
};
/**
 *  Delete an existing director record
 */
Director.destroy = function (personId) {
  const director = Director.instances[personId];
  delete Director.instances[personId];
  console.log(`Director ${director.name} deleted.`);
};
/**
 *  Retrieve all director objects as records
 */
Director.retrieveAll = function () {
  var directors = {};
  if (!localStorage["directors"]) localStorage["directors"] = "{}";
  try {
    directors = JSON.parse(localStorage["directors"]);
  } catch (e) {
    console.log("Error when reading from Local Storage\n" + e);
  }
  for (const key of Object.keys(directors)) {
    try {
      // convert record to (typed) object
      Director.instances[key] = new Director(directors[key]);
      // create superclass extension
      Person.instances[key] = Director.instances[key];
    } catch (e) {
      console.log(
        `${e.constructor.name} while deserializing director ${key}: ${e.message}`
      );
    }
  }
  console.log(
    `${Object.keys(Director.instances).length} Director records loaded.`
  );
};
/**
 *  Save all director objects as records
 */
Director.saveAll = function () {
  try {
    localStorage["directors"] = JSON.stringify(Director.instances);
    console.log(Object.keys(Director.instances).length + " directors saved.");
  } catch (e) {
    alert("Error when writing to Local Storage\n" + e);
  }
};

export default Director;
