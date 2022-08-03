/**
 * @fileOverview  The model class Employee with attribute definitions and storage management methods
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 * @copyright Copyright � 2020-2022 Gerd Wagner (Chair of Internet Technology) and Juan-Francisco Reyes,
 * Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */
import { fsDb } from "../initFirebase.mjs";
import { collection as fsColl, doc as fsDoc, getDoc, getDocs, orderBy,
  query as fsQuery, setDoc, Timestamp, startAt, limit, deleteField, updateDoc, where, writeBatch, arrayRemove, arrayUnion }
  from "https://www.gstatic.com/firebasejs/9.8.3/firebase-firestore.js";
import {
  IntervalConstraintViolation, MandatoryValueConstraintViolation,
  NoConstraintViolation, PatternConstraintViolation, RangeConstraintViolation, ReferentialIntegrityConstraintViolation,
  UniquenessConstraintViolation
} from "../../lib/errorTypes.mjs";
import { isIntegerOrIntegerString, isNonEmptyString, date2IsoDateString, isDateOrDateString } from "../../lib/util.mjs";
import Enumeration from "../../lib/Enumeration.mjs";
import {FieldPath} from "https://www.gstatic.com/firebasejs/9.8.3/firebase-firestore.js";
import Resort from "./Resort.mjs";

/**
 * Define three Enumerations
 * @type {Enumeration}
 */
const GenderEL = new Enumeration({"m":"male", "f":"female", "o":"other"});
const TherapyEL = new Enumeration(["Balance","Speech", "Swallowing", "Respiratory", "Vision", "Physical", "Occupational"]);

/**
 * Constructor function for the class Employee
 * @constructor
 * @param {employeeId: number, firstName: string, lastName: string, birthdate: Date, gender: array,
 * therapySkills: array} slots - Object creation slots.
 */
class Employee {
  // using a single record parameter with ES6 function parameter destructuring
  constructor ({employeeId, firstName, lastName, birthdate, gender, therapySkills}) {
    // assign properties by invoking implicit setters
    this.employeeId = employeeId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthdate = birthdate;
    this.gender = gender;
    this.therapySkills = therapySkills;
  };
  get employeeId() {
    return this._employeeId;
  }
  static checkEmployeeId( id) {
    if (!id) return new NoConstraintViolation();
    else if (!isIntegerOrIntegerString(id) || parseInt(id) < 1) {
      return new RangeConstraintViolation("The employee ID must be a positive integer!");
    } else {
      return new NoConstraintViolation();
    }
  }

  // mandatory value and uniqueness constraints
  static async checkEmployeeIdAsId(id) {
    let validationResult = Employee.checkEmployeeId( id);
    if ((validationResult instanceof NoConstraintViolation)) {
      if (!id) {
        validationResult = new MandatoryValueConstraintViolation(
            "A value for the employee ID must be provided!");
      } else {
        const employeeDocSn = await getDoc( fsDoc( fsDb, "employees", id));
        if (employeeDocSn.exists()) {
          validationResult = new UniquenessConstraintViolation(
              "There is already an employee record with this ID!");
        } else {
          validationResult = new NoConstraintViolation();
        }
      }
    }
    return validationResult;
  };

  static async checkEmployeeIdAsIdRef( id) { // therapist employees are optional for a resort ([0..*])
    let constraintViolation = Employee.checkEmployeeId( id);
    if ((constraintViolation instanceof NoConstraintViolation) && id) {
      const employeeDocSn = await getDoc( fsDoc( fsDb, "employees", String(id)));
      if (!employeeDocSn.exists()) {
        constraintViolation = new ReferentialIntegrityConstraintViolation(
            `There is no employee record with this employee ID ${id}!`);
      }
    }
    return constraintViolation;
  };

  set employeeId( id) {
    const validationResult = Employee.checkEmployeeId( id);
    if (validationResult instanceof NoConstraintViolation) {
      this._employeeId = id;
    } else {
      throw validationResult;
    }
  };

  get firstName() {
    return this._firstName;
  };

  static checkFirstName( fname) {
    if (!fname) {
      return new MandatoryValueConstraintViolation(
          "A first name must be provided!");
    } else if (!isNonEmptyString(fname)) {
      return new RangeConstraintViolation(
          "The first name must be a non-empty string!");
    } else if (!(/^[a-zA-Z]+$/.test(fname))) {
      return new PatternConstraintViolation("The first name must consist of letters only.")
    } else {
      return new NoConstraintViolation();
    }
  };

  set firstName( fname) {
    const validationResult = Employee.checkFirstName( fname);
    if (validationResult instanceof NoConstraintViolation) {
      this._firstName = fname;
    } else {
      throw validationResult;
    }
  };

  get lastName() {
    return this._lastName;
  };
  static checkLastName( lname) {
    if (!lname) {
      return new MandatoryValueConstraintViolation(
          "A last name must be provided!");
    } else if (!isNonEmptyString( lname)) {
      return new RangeConstraintViolation(
          "The last name must be a non-empty string!");
    } else if (!(/^[a-zA-Z]+$/.test(lname))){
      return new PatternConstraintViolation("The last name must consist of letters only.")
    } else {
      return new NoConstraintViolation();
    }
  };
  set lastName( lname) {
    const validationResult = Employee.checkLastName( lname);
    if (validationResult instanceof NoConstraintViolation) {
      this._lastName = lname;
    } else {
      throw validationResult;
    }
  };


  get birthdate() {
    return this._birthdate;
  };

  static checkBirthdate (birthdate) {
    const TODAY = new Date(); // current date -> employee birthdate must not be in the future

    if (!birthdate || birthdate==="") {
      return new MandatoryValueConstraintViolation("A value for the birthdate must be provided!");
    } else if (!isDateOrDateString(birthdate)) {
      return new RangeConstraintViolation("The value of birthdate must be a valid date");
    } else if (Date.parse(birthdate) > TODAY) {
      return new IntervalConstraintViolation(
          `The birthdate of an employee must not be in the future!`);
    } else return new NoConstraintViolation();
  };

  set birthdate( d) {
    let validationResult = Employee.checkBirthdate( d);
    if (validationResult instanceof NoConstraintViolation) this._birthdate = d;
    else throw validationResult;
  };

  // Enumeration properties: gender[1] and therapySkills[0..*]
  get gender() {
    return this._gender;
  };

  static checkGender( g) {
    if (!g) {
      return new MandatoryValueConstraintViolation(
          "A gender must be provided!");
    } else if (!isIntegerOrIntegerString( g) || parseInt(g) < 1 || parseInt( g) > GenderEL.MAX) {
      return new RangeConstraintViolation(
          `Invalid value for gender: ${g}`);
    } else {
      return new NoConstraintViolation();
    }
  };
  set gender( g) {
    const validationResult = Employee.checkGender( g);
    if (validationResult instanceof NoConstraintViolation) {
      this._gender = parseInt( g);
    } else {
      throw validationResult;
    }
  };

  get therapySkills() {
    return this._therapySkills;
  };

  static checkTherapySkill( therap) {
    if (!Number.isInteger( therap) || therap < 1 || therap > TherapyEL.MAX) {
      return new RangeConstraintViolation(
          `Invalid value for therapy: ${therap}`);
    } else {
      return new NoConstraintViolation();
    }
  };
  static checkTherapySkills( theraps) {
    if (!theraps || (Array.isArray( theraps) && theraps.length === 0)) {
      return new NoConstraintViolation();  // optional
    } else if (!Array.isArray( theraps)) {
      return new RangeConstraintViolation(
          "The value of therapySkills must be a list/array!");
    } else {
      for (const i of theraps.keys()) {
        const validationResult = Employee.checkTherapySkill( theraps[i]);
        if (!(validationResult instanceof NoConstraintViolation)) {
          return validationResult;
        }
      }
      return new NoConstraintViolation();
    }
  };
  set therapySkills(theraps) {
    const validationResult = Employee.checkTherapySkills( theraps);
    if (validationResult instanceof NoConstraintViolation) {
      this._therapySkills = theraps;
    } else {
      throw validationResult;
    }
  };

}
/*********************************************************
 ***  Class-level ("static") storage management methods ***
 **********************************************************/
/**
 * Conversion between an Employee object and a corresponding Firestore document
 * @type {{toFirestore: (function(*): {employeeId: (Document.employeeId|*), firstName: string,
 * lastName: string, birthdate: Date, gender: number, therapySkills: array}),
 * fromFirestore: (function(*, *=): Employee)}}
 */
Employee.converter = {
  toFirestore: function ( employee) {
    const data = {
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      birthdate: Timestamp.fromDate( new Date( employee.birthdate)),
      gender: parseInt( employee.gender)
    };
    if (employee.therapySkills) data.therapySkills = employee.therapySkills;
    else data.therapySkills = [];
    return data;
  },
  fromFirestore: function (snapshot, options) {
    const employee = snapshot.data( options),
        data = {
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          birthdate: employee.birthdate.toDate(),
          gender: parseInt( employee.gender)
        };
    if (employee.therapySkills) data.therapySkills = employee.therapySkills;
    else data.therapySkills = [];
    return new Employee( data);
  },
};
/**
 * Create a Firestore document in the Firestore collection "employees"
 * @param slots: {object}
 * @returns {Promise<void>}
 */
Employee.add = async function (slots) {
  let employee = null, validationResult = null;
  try {
    // validate data by creating Employee instance
    employee = new Employee( slots);
    // invoke asynchronous ID/uniqueness check
    validationResult = await Employee.checkEmployeeIdAsId( employee.employeeId);
    if (!validationResult instanceof NoConstraintViolation) throw validationResult;

  } catch (e) {
    console.error(`${e.constructor.name}: ${e.message}`);
    employee = null;
  }
  if (employee) {
    try {
      const employeeDocRef = fsDoc( fsDb, "employees", employee.employeeId)
        .withConverter( Employee.converter);
      setDoc( employeeDocRef, employee);
      console.log(`Employee record "${employee.employeeId}" created!`);
    } catch (e) {
      console.error(`${e.constructor.name}: ${e.message}`);
    }
  }
};

/**
 * Load an employee record from Firestore
 * @param employeeId: {string}
 * @returns {Promise<*>} employeeRec: {array}
 */
Employee.retrieve = async function (employeeId) {
  console.log("employeeId is: " + employeeId);
  try {
    if(typeof(employeeId)==="object") {
      employeeId = employeeId["id"];
    }
    const employeeRec = (await getDoc( fsDoc( fsDb, "employees", String(employeeId))
      .withConverter( Employee.converter))).data();
    if (employeeRec) console.log(`Employee record "${employeeId}" retrieved.`);
    return employeeRec;
  } catch (e) {
    console.error(`Error retrieving employee record: ${e}`);
  }
};

/**
 * Load all employee records from Firestore
 * @param params: {object}
 * @returns {Promise<*>} employeeRecs: {array}
 */
Employee.retrieveBlock = async function (params) {
  try {
    let employeesCollRef = fsColl( fsDb, "employees");
    // set limit and order in query
    employeesCollRef = fsQuery( employeesCollRef, limit( 21));
    if (params.order) {
      employeesCollRef = fsQuery( employeesCollRef, orderBy( params.order));
    }
    // set pagination "startAt" cursor
    if (params.cursor) {
       employeesCollRef = fsQuery( employeesCollRef, startAt( params.cursor));
    }
    const employeeRecs = (await getDocs( employeesCollRef
        .withConverter( Employee.converter))).docs.map(d => d.data());
    if (employeeRecs.length) {
      console.log(`Block of employee records retrieved! (cursor: ${employeeRecs[0][params.order]})`);
    }
    return employeeRecs;
  } catch (e) {
    console.error(`Error retrieving all employee records: ${e}`);
  }
};

/**
 * Update a Firestore document in the Firestore collection "employees"
 * @param employeeId: {string}
 * @param firstName: {string}
 * @param lastName: {string}
 * @param birthdate: {string}
 * @param gender: {string}
 * @param therapySkills {array?}
 * @returns {Promise<void>}
 */
Employee.update = async function ({employeeId, firstName, lastName, birthdate, gender, therapySkills}) {
  let validationResult = null,
    employeeBeforeUpdate = null;
  const employeeDocRef = fsDoc( fsDb, "employees", employeeId).withConverter( Employee.converter),
    updatedSlots = {};
  try {
    // retrieve up-to-date employee record
    employeeBeforeUpdate = (await getDoc( employeeDocRef)).data();
  } catch (e) {
    console.error(`${e.constructor.name}: ${e.message}`);
  }
  // evaluate if slots contains updates, while building "updatedSlots" object
  if (employeeBeforeUpdate) {
    if (employeeBeforeUpdate.firstName !== firstName) updatedSlots.firstName = firstName;
    if (employeeBeforeUpdate.lastName !== lastName) updatedSlots.lastName = lastName;

    if (Date.parse(employeeBeforeUpdate.birthdate) !== Date.parse(birthdate))
      updatedSlots.birthdate = Timestamp.fromDate(new Date(birthdate));

    if (parseInt(employeeBeforeUpdate.gender) !== parseInt(gender)) updatedSlots.gender = gender;

    if ((therapySkills) && JSON.stringify(employeeBeforeUpdate.therapySkills) !== JSON.stringify(therapySkills)) {
      updatedSlots.therapySkills = therapySkills;
    } else if (!therapySkills && employeeBeforeUpdate.therapySkills !== undefined) {
      updatedSlots.therapySkills = deleteField();
    }
  }

  const updatedProperties = Object.keys(updatedSlots);
  if (updatedProperties.length) { // execute only if there are updates
    try {
      // check constraint validation for publication date
      if(updatedSlots.firstName) {
        validationResult = Employee.checkFirstName( firstName);
        if (!(validationResult instanceof NoConstraintViolation)) throw validationResult;
      }
      if(updatedSlots.lastName) {
        validationResult = Employee.checkLastName( lastName);
        if (!(validationResult instanceof NoConstraintViolation)) throw validationResult;
      }
      if (updatedSlots.birthdate) {
        validationResult = Employee.checkBirthdate( birthdate);
        if (!(validationResult instanceof NoConstraintViolation)) throw validationResult;
      }

      if (updatedSlots.gender) {
        validationResult = Employee.checkGender( gender);
        if (!(validationResult instanceof NoConstraintViolation)) throw validationResult;
      }

      if (updatedSlots.therapySkills) {
        validationResult = Employee.checkTherapySkills(therapySkills);
        if (!(validationResult instanceof NoConstraintViolation)) throw validationResult;
      }

      // update employee (source) object
      updateDoc( employeeDocRef, updatedSlots);

      if(updatedSlots.therapySkills) { // therapySkills have been updated

          if (validationResult instanceof NoConstraintViolation) {

            const resortsCollRef = fsColl( fsDb, "resorts");
            // query for resorts who reference this employee as therapist -> they are affected by updates to this employee's therapySkills
            const q = fsQuery( resortsCollRef, where("therapistIdRefs", "array-contains", parseInt(employeeId)));
            const resortsQrySns = (await getDocs( q));

            if(updatedSlots.therapySkills.length === 0) { // if after update, this employee has no more therapySkills => cannot be therapist in a resort
              // -> delete the therapist reference to this employee from all resorts where he is therapist:
              const batch = writeBatch( fsDb);
              await Promise.all( resortsQrySns.docs.map( d => {
                const resortDocRef = fsDoc(resortsCollRef, d.id);
                batch.update(resortDocRef, {
                  therapistIdRefs: arrayRemove(parseInt(employeeId))
                });
              }));
              batch.commit(); // commit batch write
            } // any updates on therapistIdRefs need to be committed before deriving available rehas from them

            // now derive availableRehas again for all resorts referencing the updated employee as therapist
            // 2 cases:
            // case 1: after update of therapySkills, the employee has no more therapySkills -> got removed as therapist due to lack of any therapySkills after update
            //    -> this can affect (reduce) available rehas for resorts referencing this employee as therapist (if no other therapist has the skills that this therapist previously had)
            // case 2: employee's therapySkills change, but he is still qualified as therapist (at least 1 therapySkill)
            //     -> therapistIdRefs for resorts referencing this employee as therapist remain unchanged but their available rehas might change
            const batchUpdateAvailableRehas = writeBatch( fsDb);

            for (const resortDoc of resortsQrySns.docs) {
              const resortDocRefRehas = fsDoc( fsDb, "resorts", resortDoc.id)
                  .withConverter( Resort.converter);
              const resortRec = (await getDoc(resortDocRefRehas)).data();
              const rehasArray = await Resort.deriveAvailableRehas(resortRec.therapistIdRefs);
              const slots = {
                availableRehas: rehasArray
              };
              batchUpdateAvailableRehas.update(resortDocRefRehas, slots);
            }
            batchUpdateAvailableRehas.commit(); // commit batch write
          }
      }
    } catch (e) {
      console.error(`${e.constructor.name}: ${e.message}`);
    }
    console.log(`Property(ies) "${updatedProperties.toString()}" modified for employee record "${employeeId}"`);
  } else {
    console.log(`No property value changed for employee record "${employeeId}"!`);
  }
};

/**
 * Delete a Firestore document from the Firestore collection "employees" (associated to resorts as therapists)
 * @param slots: {object}
 * @returns {Promise<void>}
 */
Employee.destroy = async function (employeeId) {
  const resortsCollRef = fsColl( fsDb, "resorts");
  const employeesCollRef = fsColl( fsDb, "employees");

  try {
    const q = fsQuery( resortsCollRef, where("therapistIdRefs", "array-contains", parseInt(employeeId))),
        q2 = fsQuery( resortsCollRef, where("manager_id", "==", String(employeeId))),
        employeeDocRef = fsDoc( employeesCollRef, String( employeeId)),
        resortsQrySnsTherapists = (await getDocs( q)),
        resortsQrySnsManager = (await getDocs( q2)),
        batch = writeBatch( fsDb); // initiate batch write

    let resortIdRefsArray = [];
    // iterate and delete associations (references) in resort records
    await Promise.all( resortsQrySnsTherapists.docs.map( d => {
      const resortDocRef = fsDoc(resortsCollRef, d.id);
      resortIdRefsArray.push(d.id);
      batch.update(resortDocRef, {
        therapistIdRefs: arrayRemove(parseInt(employeeId))
      });
    }));
    // iterate and delete resorts where this employee was manager (existential dependence)
    await Promise.all( resortsQrySnsManager.docs.map( d => {
      const resortDocRef = fsDoc(resortsCollRef, d.id);
      resortIdRefsArray = resortIdRefsArray.filter(resort => String(resort) !== d.id);
      batch.delete(resortDocRef);
    }));
    batch.delete( employeeDocRef); // delete employee record
    batch.commit(); // commit batch write

    const batchDeriveRehas = writeBatch( fsDb);
    for(const resid of resortIdRefsArray) {
      const resortDocRefRehas = fsDoc( fsDb, "resorts", resid)
          .withConverter( Resort.converter);
      const resortRec = (await getDoc(resortDocRefRehas)).data();
      const rehasArray = await Resort.deriveAvailableRehas(resortRec.therapistIdRefs);
      const slots = {
        availableRehas: rehasArray
      };
      batchDeriveRehas.update(resortDocRefRehas, slots);
      //updateDoc( resortDocRefRehas, slots);
    }
    batchDeriveRehas.commit(); // commit batch write

    console.log(`Employee record ${employeeId} deleted!`);
  } catch (e) {
    console.error(`Error deleting employee record: ${e}`);
  }
};

export default Employee;
export { GenderEL, TherapyEL };
