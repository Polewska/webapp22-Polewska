/**
 * @fileOverview  The model class Resort with attribute definitions and storage management methods
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 * @copyright Copyright � 2020-2022 Gerd Wagner (Chair of Internet Technology) and Juan-Francisco Reyes,
 * Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */
import { fsDb } from "../initFirebase.mjs";
import { collection as fsColl, deleteDoc, doc as fsDoc, getDoc, getDocs, orderBy,
  query as fsQuery, setDoc, startAt, limit, updateDoc }
  from "https://www.gstatic.com/firebasejs/9.8.3/firebase-firestore.js";
import Employee from "./Employee.mjs";
import { isIntegerOrIntegerString, isNonEmptyString} from "../../lib/util.mjs";

import {
  MandatoryValueConstraintViolation,
  NoConstraintViolation, PatternConstraintViolation, RangeConstraintViolation, ReferentialIntegrityConstraintViolation,
  UniquenessConstraintViolation
} from "../../lib/errorTypes.mjs";

/**
 * Constructor function for the class Resort
 * @constructor
 * @param {resortId: string, city: string, manager: string, therapists: array, availableRehas: array} slots - Object creation slots.
 */
class Resort {
  // using a single record parameter with ES6 function parameter destructuring
  constructor ({resortId, city, manager_id, therapistIdRefs, availableRehas}) {
    // assign properties by invoking implicit setters
    this.resortId = resortId;
    this.city = city;
    this.manager_id = manager_id; // employeeId of the Employee, who is the manager of this resort
    if (therapistIdRefs) this.therapistIdRefs = therapistIdRefs; // employeeIds of the Employees who work at this resort
    if (availableRehas) this.availableRehas = availableRehas; // derived from the therapySkills of the employees working here
    //availableRehas ? this.availableRehas = availableRehas : [];
  };

  get resortId () {
    return this._resortId;
  };

  static checkResortId( id) {
    if (!id) return new NoConstraintViolation();
    else if (!isIntegerOrIntegerString(id) || parseInt(id) < 1) {
      return new RangeConstraintViolation("The resort ID must be a positive integer!");
    } else {
      return new NoConstraintViolation();
    }
  }

  // mandatory value and uniqueness constraints
  static async checkResortIdAsId(id) {
    let validationResult = Resort.checkResortId( id);
    if ((validationResult instanceof NoConstraintViolation)) {
      if (!id) {
        validationResult = new MandatoryValueConstraintViolation(
            "A value for the resort ID must be provided!");
      } else {
        const resortDocSn = await getDoc( fsDoc( fsDb, "resorts", id));
        if (resortDocSn.exists()) {
          validationResult = new UniquenessConstraintViolation(
              "There is already an resort record with this ID!");
        } else {
          validationResult = new NoConstraintViolation();
        }
      }
    }
    return validationResult;
  };

  static async checkResortIdAsIdRef ( id) {
    let validationResult = Resort.checkResortId( id);
    if ((validationResult instanceof NoConstraintViolation)) {
      if (!id) {
        validationResult = new MandatoryValueConstraintViolation(
            "A value for the resort ID must be provided!");
      } else {
        const resortDocSn = await getDoc( fsDoc( fsDb, "resorts", id));
        if (!resortDocSn.exists()) {
          validationResult = new UniquenessConstraintViolation(
              `There is no resort record with this ID ${id}!`);
        } else validationResult = new NoConstraintViolation();
      }
    }
    return validationResult;
  };

  set resortId( id) {
    const validationResult = Resort.checkResortId( id);
    if (validationResult instanceof NoConstraintViolation) {
      this._resortId = id;
    } else {
      throw validationResult;
    }
  };

  get city() {
    return this._city;
  };

  static checkCity( city) {
    if (!city) {
      return new MandatoryValueConstraintViolation("The name of the city must be provided!");
    } else if (!isNonEmptyString(city)) {
      return new RangeConstraintViolation(
          "The name of the city must be a non-empty string!");
    } else if (!(/^[a-zA-Z]+$/.test(city))) {
      return new PatternConstraintViolation("The name of the city must consist of letters only.")
    } else {
      return new NoConstraintViolation();
    }
  };

  set city( city) {
    const validationResult = Resort.checkCity( city);
    if (validationResult instanceof NoConstraintViolation) {
      this._city = city;
    } else {
      throw validationResult;
    }
  };

  // get/set and checkManager
  get manager_id() {
    return this._manager_id;
  };

  static checkManagerId( id) {
    let validationResult = Employee.checkEmployeeId(id);
    if (!(validationResult instanceof NoConstraintViolation)) {
      return validationResult;
    }
    if (!id) {
      return new MandatoryValueConstraintViolation(
            "A value for the manager ID must be provided!");
    }
    return new NoConstraintViolation();
  };

  static async checkManagerIdAsIdRef( id) {
    let constraintViolation = Resort.checkManagerId( id);
    if ((constraintViolation instanceof NoConstraintViolation) && id) {
      const employeeDocSn = await getDoc( fsDoc( fsDb, "employees", String(id)));
      if (!employeeDocSn.exists()) {
        constraintViolation = new ReferentialIntegrityConstraintViolation(
            `There is no employee record with this employee ID ${id}!`);
      }
    }
    return constraintViolation;
  };

  set manager_id(managerId) {
    this._manager_id = managerId;
  };


  static async checkTherapistIdRef( therapistId) {
    if(!therapistId) return new NoConstraintViolation();

    const validationResult = await Employee.checkEmployeeIdAsIdRef(therapistId);
    if(!(validationResult instanceof NoConstraintViolation)) return validationResult;

    const therapistRec = await Employee.retrieve(therapistId);
    if (therapistRec.therapySkills.length < 1) {
      return new RangeConstraintViolation(
          "A therapist must be an employee with at least 1 therapy skill!");
    }
    return new NoConstraintViolation();
  };



  get therapistIdRefs() {
    return this._therapistIdRefs;
  };
  addTherapist( t) {
    this._therapistIdRefs.push( t);
  };
  removeTherapist( therapist) {
    this._therapistIdRefs = this._therapistIdRefs.filter( t => t.id !== therapist.id);
  };

  set therapistIdRefs( therapistIds) {
    this._therapistIdRefs = therapistIds;
  };

  get availableRehas() {
    return this._availableRehas;
  };

  set availableRehas (availableRehas) {
    this._availableRehas = availableRehas;
  }


}

/**
 * derives available rehabilitation therapies from therapySkills of the employees working here as therapists
 *
 * @param therapistIds
 * @returns {Promise<*[]>}
 */
Resort.deriveAvailableRehas = async function (therapistIds) {

  if(!therapistIds || therapistIds === []) return [];

  let newAvailableRehasArray = [];

  for(const therapistId of therapistIds) {
    let therapistRec = null;
    if(typeof(therapistId) !== "object") {
      therapistRec = await Employee.retrieve(therapistId);
    } else {
      therapistRec = therapistId;
    }

    const keys = Object.keys( therapistRec.therapySkills);
    for(const key in keys) {
      if(! newAvailableRehasArray.includes(parseInt(therapistRec.therapySkills[key]))) {
        newAvailableRehasArray.push(parseInt(therapistRec.therapySkills[key]));
      }
    }
  }
  return newAvailableRehasArray.sort();
};

/*********************************************************
 ***  Class-level ("static") storage management methods ***
 **********************************************************/
/**
 * Conversion between a Resort object and a corresponding Firestore document
 * @type {{toFirestore: (function(*): {resortId: (Document.employeeId|*), city: string,
 * manager_id: string, therapistIdRefs: array, availableRehas: array}),
 * fromFirestore: (function(*, *=): Resort)}}
 */
Resort.converter = {
  toFirestore: function ( resort) {
    const data = {
      resortId: resort.resortId,
      city: resort.city,
      manager_id: resort.manager_id
    };
    if (resort.therapistIdRefs) {
      data.therapistIdRefs = resort.therapistIdRefs;
    }
    if(resort.availableRehas) {
      data.availableRehas = resort.availableRehas;
    }
    return data;
  },
  fromFirestore: function (snapshot, options) {
    const data = snapshot.data( options);
    return new Resort( data);
  },
};
/**
 * Create a Firestore document in the Firestore collection "resorts"
 * @param slots: {object}
 * @returns {Promise<void>}
 */
Resort.add = async function (slots) {
  let resort = null, validationResult = null;
  try {
    // validate data by creating Resort instance
    resort = new Resort( slots);
    // invoke asynchronous ID/uniqueness checks
    validationResult = await Resort.checkResortIdAsId( resort.resortId);
    if (!(validationResult instanceof NoConstraintViolation)) throw validationResult;

    validationResult = await Employee.checkEmployeeIdAsIdRef( resort.manager_id);
    if (!(validationResult instanceof NoConstraintViolation)) throw validationResult;

    if(resort.therapistIdRefs) {
      for (const t of resort.therapistIdRefs) {
        const validationResult = await Employee.checkEmployeeIdAsIdRef(String(t));
        if (!(validationResult instanceof NoConstraintViolation)) {
          throw validationResult;
        }
        const valResult = await Resort.checkTherapistIdRef(t);
        if (!(valResult instanceof NoConstraintViolation)) throw valResult;
      }
      if (!resort.availableRehas || resort.availableRehas === [] ) {
        resort.availableRehas = await Resort.deriveAvailableRehas(resort.therapistIdRefs);
      }
      // resort.availableRehas = await Resort.deriveAvailableRehas(resort.therapistIdRefs);
    }

  } catch (e) {
    console.error(`${e.constructor.name}: ${e.message}`);
    resort = null;
  }
  if (resort) {
    try {
      const resortDocRef = fsDoc( fsDb, "resorts", resort.resortId)
        .withConverter( Resort.converter);
      setDoc( resortDocRef, resort);
      console.log(`Resort record "${resort.resortId}" created!`);
    } catch (e) {
      console.error(`${e.constructor.name}: ${e.message}`);
    }
  }
};


Resort.retrieve = async function (resortId) {
  try {
    const resortRec = (await getDoc( fsDoc( fsDb, "resorts", resortId)
      .withConverter( Resort.converter))).data();
    if (resortRec) console.log(`Resort record "${resortId}" retrieved.`);
    return resortRec;
  } catch (e) {
    console.error(`Error retrieving resort record: ${e}`);
  }
};
/**
 * Load all resort records from Firestore
 * @param params: {object}
 * @returns {Promise<*>} resortRecs: {array}
 */
Resort.retrieveBlock = async function (params) {
  try {
    let resortsCollRef = fsColl( fsDb, "resorts");
    // set limit and order in query
    resortsCollRef = fsQuery( resortsCollRef, limit( 21));
    if (params.order) resortsCollRef = fsQuery( resortsCollRef, orderBy( params.order));
    // set pagination "startAt" cursor
    if (params.cursor) {
      resortsCollRef = fsQuery( resortsCollRef, startAt( params.cursor));
    }
    const resortRecs = (await getDocs( resortsCollRef
      .withConverter( Resort.converter))).docs.map(d => d.data());
    if (resortRecs.length) {
      console.log(`Block of resort records retrieved! (cursor: ${resortRecs[0][params.order]})`);
    }
    return resortRecs;
  } catch (e) {
    console.error(`Error retrieving all resort records: ${e}`);
  }
};
/**
 * Update a Firestore document in the Firestore collection "resorts"
 * @param resortId: {string}
 * @param city: {string}
 * @param manager_id: {string}
 * @param therapistIdRefsToAdd {array?}
 * @param therapistIdRefsToRemove {array?}
 * @returns {Promise<void>}
 */
Resort.update = async function ({resortId, city, manager_id, therapistIdRefsToAdd, therapistIdRefsToRemove}) {
  let validationResult = null,
    resortBeforeUpdate = null;
  const resortDocRef = fsDoc( fsDb, "resorts", resortId).withConverter( Resort.converter),
    updatedSlots = {};
  try {
    // retrieve up-to-date resort record
    resortBeforeUpdate = (await getDoc( resortDocRef)).data();
  } catch (e) {
    console.error(`${e.constructor.name}: ${e.message}`);
  }
  // evaluate if slots contains updates, while building "updatedSlots" object
  if (resortBeforeUpdate) {
    if (resortBeforeUpdate.city !== city) updatedSlots.city = city;
    if (resortBeforeUpdate.manager_id !== manager_id) updatedSlots.manager_id = manager_id;

    if (therapistIdRefsToAdd)
      for (const therapistIdRef of therapistIdRefsToAdd) {
        if (typeof (therapistIdRef) === "object") {
          resortBeforeUpdate.addTherapist( parseInt(therapistIdRef.id));
        } else {
          resortBeforeUpdate.addTherapist( parseInt(therapistIdRef));
        }
      }

    if (therapistIdRefsToRemove)
      for (const therapistIdRef of therapistIdRefsToRemove)
        resortBeforeUpdate.removeTherapist( therapistIdRef);

    if (therapistIdRefsToAdd || therapistIdRefsToRemove)
      updatedSlots.therapistIdRefs = resortBeforeUpdate.therapistIdRefs;
  }
  const updatedProperties = Object.keys(updatedSlots);
  if (updatedProperties.length) { // execute only if there are updates
    try {
      // check constraint validation for the name of the city
      if (updatedSlots.city) {
        validationResult = Resort.checkCity( city);
        if (!validationResult instanceof NoConstraintViolation) throw validationResult;
      }

      // check constraint validation for manager_id
      if (updatedSlots.manager_id) {
        validationResult = Employee.checkEmployeeIdAsIdRef( manager_id);
        if (!validationResult instanceof NoConstraintViolation) throw validationResult;
      }

      // check constraint validation for therapistIdrefs
      if (therapistIdRefsToAdd) {
        await Promise.all(therapistIdRefsToAdd.map( async t => {
          validationResult = await Employee.checkEmployeeIdAsIdRef( t.id);
          if (!validationResult instanceof NoConstraintViolation) throw validationResult;
        }));
        for(const tRef of therapistIdRefsToAdd) {
          validationResult = await Resort.checkTherapistIdRef(tRef);
          if (!validationResult instanceof NoConstraintViolation) throw validationResult;
        }

        updatedSlots.availableRehas = await Resort.deriveAvailableRehas(updatedSlots.therapistIdRefs);
      }
      // update resort (source) object
      updateDoc( resortDocRef, updatedSlots);
    } catch (e) {
      console.error(`${e.constructor.name}: ${e.message}`);
    }
    console.log(`Property(ies) "${updatedProperties.toString()}" modified for resort record "${resortId}"`);
  } else {
    console.log(`No property value changed for resort record "${resortId}"!`);
  }
};
/**
 * Delete a Firestore document from the Firestore collection "resorts"
 * @param resortId: {string}
 * @returns {Promise<void>}
 */
Resort.destroy = async function (resortId) {
  try {
    await deleteDoc( fsDoc(fsDb, "resorts", String(resortId)));
    console.log(`Resort record "${resortId}" deleted!`);
  } catch (e) {
    console.error(`Error deleting resort record: ${e}`);
  }
};

export default Resort;
