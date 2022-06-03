/**
 * @fileOverview  The model class Actor with attribute definitions, (class-level) check methods,
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
 * The class Actor
 * @class
 */
class Actor extends Person {
  // using a single record parameter with ES6 function parameter destructuring
  constructor({ personId, name, agent }) {
    super({ personId, name }); // invoke Person constructor
    if (agent) {
      this.agent = agent;
    }
  }
  get agent() {
    return this._agent;
  }
  set agent(ag) {
    const agentId = typeof ag !== "object" ? ag : ag.personId;
    const validationResult = Actor.checkAgent(agentId);
    if (validationResult instanceof NoConstraintViolation) {
      // create the new actor reference
      this._agent = Person.instances[agentId];
    } else {
      throw validationResult;
    }
  }
  static checkAgent(agentId) {
    const validationResult = Actor.checkPersonIdAsIdRef(agentId);
    return validationResult;
  }
  static checkActorIdAsIdRef(id) {
    var constraintViolation = Actor.checkPersonId(id);
    if (constraintViolation instanceof NoConstraintViolation && id) {
      if (!Actor.instances[String(id)]) {
        constraintViolation = new ReferentialIntegrityConstraintViolation(
          `There is no Actor record with this Actor ID! ${id} `
        );
      }
    }
    return constraintViolation;
  }

  toString() {
    var ActorStr = `Actor{ persID: ${this.personId}, name: ${this.name}}`;
    if (this.agent) ActorStr += `agent: ${this.agent.personId} }`;
    return ActorStr;
  }
}
/*****************************************************
 *** Class-level ("static") properties ***************
 *****************************************************/
// initially an empty collection (in the form of a map)
Actor.instances = {};
// add Actor to the list of Person subtypes
Person.subtypes.push(Actor);

/**********************************************************
 ***  Class-level ("static") storage management methods ***
 **********************************************************/
/**
 *  Create a new Actor record
 */
Actor.add = function (slots) {
  var actor = null;
  try {
    actor = new Actor(slots);
  } catch (e) {
    console.log(`${e.constructor.name + ": " + e.message}`);
    actor = null;
  }
  if (actor) {
    Actor.instances[actor.personId] = actor;
    console.log(`Saved: ${actor.name}`);
  }
};
/**
 *  Update an existing Actor record
 */
Actor.update = function ({ personId, name, agentId }) {
  const actor = Actor.instances[personId],
    objectBeforeUpdate = cloneObject(actor);
  var noConstraintViolated = true,
    updatedProperties = [];
  try {
    if (name && actor.name !== name) {
      actor.name = name;
      updatedProperties.push("name");
    }
    if (agentId && parseInt(actor.agentId) !== parseInt(agentId)) {
      actor.agent = agentId;
      updatedProperties.push("agent");
    }
  } catch (e) {
    console.log(e.constructor.name + ": " + e.message);
    noConstraintViolated = false;
    // restore object to its state before updating
    Actor.instances[personId] = objectBeforeUpdate;
  }
  if (noConstraintViolated) {
    if (updatedProperties.length > 0) {
      console.log(
        `Property ${updatedProperties.toString()} modified for actor ${name}`
      );
    } else {
      console.log(`No property value changed for actor ${name}!`);
    }
  }
};
/**
 *  Delete an existing Actor record
 */
Actor.destroy = function (personId) {
  const actor = Actor.instances[personId];
  delete Actor.instances[personId];
  console.log(`Actor ${actor.name} deleted.`);
};
/**
 *  Retrieve all actor objects as records
 */
Actor.retrieveAll = function () {
  var actors = {};
  if (!localStorage["actors"]) localStorage["actors"] = "{}";
  try {
    actors = JSON.parse(localStorage["actors"]);
  } catch (e) {
    console.log("Error when reading from Local Storage\n" + e);
  }
  for (const key of Object.keys(actors)) {
    try {
      // convert record to (typed) object
      Actor.instances[key] = new Actor(actors[key]);
      // create superclass extension
      Person.instances[key] = Actor.instances[key];
    } catch (e) {
      console.log(
        `${e.constructor.name} while deserializing actor ${key}: ${e.message}`
      );
    }
  }
  console.log(`${Object.keys(Actor.instances).length} Actor records loaded.`);
};
/**
 *  Save all actor objects as records
 */
Actor.saveAll = function () {
  try {
    localStorage["actors"] = JSON.stringify(Actor.instances);
    console.log(Object.keys(Actor.instances).length + " actors saved.");
  } catch (e) {
    alert("Error when writing to Local Storage\n" + e);
  }
};

export default Actor;
