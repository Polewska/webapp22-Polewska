/**
 * @fileOverview  The model class Person with property definitions, (class-level)
 *                check methods, setter methods, and the special methods saveAll
 *                and retrieveAll
 * @author Gerd Wagner
 */
import Movie from "./Movie.mjs";
import { cloneObject, isNonEmptyString, isPositiveInteger } from "../../lib/util.mjs";
import { NoConstraintViolation, MandatoryValueConstraintViolation,
  RangeConstraintViolation, UniquenessConstraintViolation,
  ReferentialIntegrityConstraintViolation }
  from "../../lib/errorTypes.mjs";

/**
 * The class Person
 * @class
 * @param {object} slots - Object creation slots.
 */
class Person {
  // using a single record parameter with ES6 function parameter destructuring
  constructor ({personId, name}) {
    // assign properties by invoking implicit setters
    this.personId = personId;  // number (integer)
    this.name = name;  // string
    this._directedMovies ={}; // empty map of Movies
    this._playedMovies = {}; // empty map of Mocies
  }
  // Getters 
  get personId() {
    return this._personId;
  }
  get name() {
    return this._name;
  }
  get directedMovies(){
    return this._directedMovies;
  }
  get playedMovies(){
    return this._playedMovies;
  }

  // Seters
  set personId(id) {
    const constraintViolation = Person.checkPersonIdAsId(id);
    if (constraintViolation instanceof NoConstraintViolation) {
      this._personId = parseInt( id);
    } else {
      throw constraintViolation;
    }
  }
  set name( n) {
    const validationResult = Person.checkName(n);
    if (validationResult instanceof NoConstraintViolation) {
      this._name = n;
    } else {
      throw validationResult;
    }
  }

  static checkPersonId(id) {
    if (!id) {
      return new NoConstraintViolation();  // may be optional as an IdRef
    } else {
      id = parseInt( id);  // convert to integer
      if (isNaN( id) || !Number.isInteger( id) || id < 1) {
        return new RangeConstraintViolation("The person ID must be a positive integer!");
      } else {
        return new NoConstraintViolation();
      }
    }
  }
  static checkPersonIdAsId( id) {
    var constraintViolation = Person.checkPersonId(id);
    if ((constraintViolation instanceof NoConstraintViolation)) {
      // convert to integer
      id = parseInt(id);
      if (isNaN(id)) {
        return new MandatoryValueConstraintViolation(
            "A positive integer value for the Person ID is required!");
      } else if (Person.instances[String(id)]) {  // convert to string if number
        constraintViolation = new UniquenessConstraintViolation(
            `There is already a Person record with this !${id}`);
      } else {
        constraintViolation = new NoConstraintViolation();
      }
    }
    return constraintViolation;
  }
  static checkPersonIdAsIdRef( id) {
    var constraintViolation = Person.checkPersonId( id);
    if ((constraintViolation instanceof NoConstraintViolation) && id) {
      if (!Person.instances[String(id)]) {
        constraintViolation = new ReferentialIntegrityConstraintViolation(
            `There is no Person record with this Person ID!${id}`);
      }
    }
    return constraintViolation;
  }

  static checkName (name) {
    if (!name) {
      console.log(`${this._personId}${name}`)
      return new MandatoryValueConstraintViolation("A Name must be provided!");
    } else if (!isNonEmptyString(name)) {
      return new RangeConstraintViolation("Name has to be a non-Empty string!");
    } else {
      return new NoConstraintViolation();
    }
  };

  toJSON() {  // is invoked by JSON.stringify
    var rec = {};
    for (const p of Object.keys( this)) {
      // remove underscore prefix
      if (p.charAt(0) === "_" && p !== "_playedMovies" && p !== "_directedMovies"){

        rec[p.substr(1)] = this[p];
      }
    }
    return rec;
  }
}
/****************************************************
*** Class-level ("static") properties ***************
*****************************************************/
// initially an empty collection (in the form of a map)
Person.instances = {};

/**********************************************************
 ***  Class-level ("static") storage management methods ***
 **********************************************************/
/**
 *  Create a new Person record/object
 */
 Person.add = function (slots) {
  var person = null;
  try {
    person = new Person( slots);
  } catch (e) {
    console.log( `${e.constructor.name}: ${e.message}`);
    person = null;
  }
  if (person) {
    Person.instances[person.personId] = person;
    console.log(`Create: ${person.name}`);
  }
};
/**
 *  Update an existing person record/object
 */
 Person.update = function ({personId, name}) {
  const person = Person.instances[String( personId)],
        objectBeforeUpdate = cloneObject(person);
  var noConstraintViolated=true, ending="", updatedProperties=[];
  try {
    if (name && person.name !== name) {
      person.name = name;
      updatedProperties.push("name");
    }
  } catch (e) {
    console.log( `${e.constructor.name}: ${e.message}`);
    noConstraintViolated = false;
    // restore object to its state before updating
    Person.instances[String(personId)] = objectBeforeUpdate;
  }
  if (noConstraintViolated) {
    if (updatedProperties.length > 0) {
      ending = updatedProperties.length > 1 ? "ies" : "y";
      console.log( `Propert${ending} ${updatedProperties.toString()} modified for person ${name}`);
    } else {
      console.log( `No property value changed for person ${name}!`);
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
  // delete all dependent movie records
  for (const movieId of Object.keys(person.playedMovies)) {
    const movie = person.playedMovies[movieId];
    if (movie.actors[personId]) delete movie.actors[personId];
  }
  for (const movieId of Object.keys( Movie.instances)) {
    const movie = Movie.instances[movieId];
    if(movie._director[personId]){ 
      delete movie._director;
    }
  }
  // delete the person object
  delete Person.instances[personId];
  console.log( `Person ${person.name} deleted.`);
};
/**
 *  Load all person records and convert them to objects
 */
Person.retrieveAll = function () {
  var persons = {};
  if (!localStorage["persons"]) localStorage["persons"] = "{}";
  try {
    persons = JSON.parse( localStorage["persons"]);
  } catch (e) {
    console.log( "Error when reading from Local Storage\n" + e);
    persons = {};
  }
  for (const key of Object.keys(persons)) {
    try {
      // convert record to (typed) object
      Person.instances[key] = new Person( persons[key]);
    } catch (e) {
      console.log( `${e.constructor.name} while deserializing person ${key}: ${e.message}`);
    }
  }
  console.log( `${Object.keys(persons).length} person records loaded.`);
};
/**
 *  Save all person objects as records
 */
 Person.saveAll = function () {
  const nmrOfPerson = Object.keys( Person.instances).length;
  try {
    localStorage["persons"] = JSON.stringify( Person.instances);
    console.log( `${nmrOfPerson} person records saved.`);
  } catch (e) {
    alert( "Error when writing to Local Storage\n" + e);
  }
};

export default Person;
