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
import { collection as fsColl, deleteDoc, doc as fsDoc, getDoc, getDocs, onSnapshot,
  orderBy, query as fsQuery, setDoc, updateDoc, Timestamp }
  from "https://www.gstatic.com/firebasejs/9.8.3/firebase-firestore.js";
import { isNonEmptyString, isIntegerOrIntegerString, createModalFromChange }
  from "../../lib/util.mjs";
import {
  NoConstraintViolation, MandatoryValueConstraintViolation,
  RangeConstraintViolation, UniquenessConstraintViolation, PatternConstraintViolation
}
  from "../../lib/errorTypes.mjs";
import Enumeration from "../../lib/Enumeration.mjs";


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
 * therapySkills: array?} slots - Object creation slots.
 */
class Employee {
  // record parameter with the ES6 syntax for function parameter destructuring
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
  static checkBirthdate(date) {
    if (!date) {
      return new MandatoryValueConstraintViolation("A birthdate must be provided!");
    } else {
      let isDate = date instanceof Date || (typeof date === "string" && !isNaN(new Date(date).getDate()));
      if(!isDate) {
        return new RangeConstraintViolation("The value of birthdate must be a valid date!");
      }
    }
    return new NoConstraintViolation();
  };

  set birthdate( date) {
    //if(date instanceof Object && ! (date instanceof Date)) {
    if(date instanceof Timestamp) {
      date = date.toDate();
    } else if (typeof date === "number") {
      date = new Date(date);
    }
    const validationResult = Employee.checkBirthdate( date);
    if (validationResult instanceof NoConstraintViolation) {
      if(typeof date === "string") {
        this.birthdate = new Date(Date.parse( date));
      }
      else {
        this._birthdate = date;
      }
    } else {
      throw validationResult;
    }
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
 * @type {{toFirestore: (function(*): {employeeId: number, firstName: string,
 * lastName: string, birthdate: Date, gender: number, therapySkills: array}),
 * fromFirestore: (function(*, *=): Employee)}}
 */
Employee.converter = {
  toFirestore: function (employee) {
    return {
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      birthdate: employee.birthdate,
      gender: parseInt( employee.gender),
      therapySkills: employee.therapySkills
    };
  },
  fromFirestore: function (snapshot, options) {
    const data = snapshot.data( options);
    return new Employee( data);
  }
};
/**
 * Create a Firestore document in the Firestore collection "employees"
 * @param slots: {object}
 * @returns {Promise<void>}
 */
Employee.add = async function (slots) {
  let employee = null;
  try {
    // validate data by creating Employee instance
    employee = new Employee( slots);
    // invoke asynchronous ID/uniqueness check
    let validationResult = await Employee.checkEmployeeIdAsId( employee.employeeId);
    if (!validationResult instanceof NoConstraintViolation) throw validationResult;
  } catch (e) {
    console.error(`${e.constructor.name}: ${e.message}`);
    employee = null;
  }
  if (employee) {
    try {
      const employeeDocRef = fsDoc( fsDb, "employees", employee.employeeId).withConverter( Employee.converter);
      await setDoc( employeeDocRef, employee);
      console.log(`Employee record "${employee.employeeId}" created!`);
    } catch (e) {
      console.error(`${e.constructor.name}: ${e.message} + ${e}`);
    }
  }
};
/**
 * Load an employee record from Firestore
 * @param employeeId: {object}
 * @returns {Promise<*>} employeeRec: {array}
 */
Employee.retrieve = async function (employeeId) {
  try {
    const employeeRec = (await getDoc( fsDoc( fsDb, "employees", employeeId).withConverter( Employee.converter))).data();
    console.log(`Employee record "${employeeRec.employeeId}" retrieved.`);
    return employeeRec;
  } catch (e) {
    console.error(`Error retrieving employee record: ${e}`);
  }
};
/**
 * Load all employee records from Firestore
 * @param order: {string}
 * @returns {Promise<*>} employeeRecs: {array}
 */
Employee.retrieveAll = async function (order) {
  if (!order) order = "employeeId";
  const employeesCollRef = fsColl( fsDb, "employees"),
    q = fsQuery( employeesCollRef, orderBy( order));
  try {
    const employeeRecs = (await getDocs( q.withConverter( Employee.converter))).docs.map(d => d.data());
    console.log(`${employeeRecs.length} employee records retrieved ${order ? "ordered by " + order : ""}`);
    return employeeRecs;
  } catch (e) {
    console.error(`Error retrieving employee records: ${e}`);
  }
};
/**
 * Update a Firestore document in the Firestore collection "employees"
 * @param slots: {object}
 * @returns {Promise<void>}
 */
Employee.update = async function (slots) {
  console.log(slots);
  let noConstraintViolated = true,
    validationResult = null,
    employeeBeforeUpdate = null;
  const employeeDocRef = fsDoc( fsDb, "employees", slots.employeeId).withConverter( Employee.converter),
    updatedSlots = {};
  try {
    // retrieve up-to-date employee record
    const employeeDocSn = await getDoc( employeeDocRef);
    employeeBeforeUpdate = employeeDocSn.data();
  } catch (e) {
    console.error(`${e.constructor.name}: ${e.message}`);
  }
  try {
    if (employeeBeforeUpdate.firstName !== slots.firstName) {
      validationResult = Employee.checkFirstName( slots.firstName);
      if (validationResult instanceof NoConstraintViolation) updatedSlots.firstName = slots.firstName;
      else throw validationResult;
    }
    if (employeeBeforeUpdate.lastName !== slots.lastName) {
      validationResult = Employee.checkLastName( slots.lastName);
      if (validationResult instanceof NoConstraintViolation) updatedSlots.lastName = slots.lastName;
      else throw validationResult;
    }
    let d = new Date(employeeBeforeUpdate.birthdate);
    d.setDate(d.getDate()-1);
    if (d.toLocaleDateString() !== new Date(slots.birthdate).toLocaleDateString()) {
      validationResult = Employee.checkBirthdate( slots.birthdate);
      if (validationResult instanceof NoConstraintViolation) updatedSlots.birthdate = slots.birthdate;
      else throw validationResult;
    }
    if (employeeBeforeUpdate.gender !== parseInt( slots.gender)) {
      validationResult = Employee.checkGender( slots.gender);
      if (validationResult instanceof NoConstraintViolation) {
        updatedSlots.gender = parseInt( slots.gender);
      } else throw validationResult;
    }
    if (!employeeBeforeUpdate.therapySkills.isEqualTo( slots.therapySkills)) {
      validationResult = Employee.checkTherapySkills( slots.therapySkills);
      if (validationResult instanceof NoConstraintViolation) {
        updatedSlots.therapySkills = slots.therapySkills;
      } else throw validationResult;
    }

  } catch (e) {
    noConstraintViolated = false;
    console.error(`${e.constructor.name}: ${e.message}`);
  }

  if (noConstraintViolated) {
    const updatedProperties = Object.keys(updatedSlots);
    if (updatedProperties.length) {
      await updateDoc( employeeDocRef, updatedSlots);
      console.log(`Property(ies) "${updatedProperties.toString()}" modified for employee record "${slots.employeeId}"`);
    } else {
      console.log(`No property value changed for employee record "${slots.employeeId}"!`);
    }
  }
};
/**
 * Delete a Firestore document from the Firestore collection "employees"
 * @param employeeId: {number}
 * @returns {Promise<void>}
 */
Employee.destroy = async function (employeeId) {
  try {
    await deleteDoc( fsDoc(fsDb, "employees", employeeId));
    console.log(`Employee record "${employeeId}" deleted!`);
  } catch (e) {
    console.error(`Error deleting employee record: ${e}`);
  }
};
/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
/**
 * Create test data
 */
Employee.generateTestData = async function () {
  try {
    console.log("Generating test data...");
    const response = await fetch( "../../test-data/employees.json");
    const employeeRecs = await response.json();
    await Promise.all( employeeRecs.map( d => Employee.add( d)));
    console.log(`${employeeRecs.length} employee records saved.`);
  } catch (e) {
    console.error(`${e.constructor.name}: ${e.message}`);
  }
};
/**
 * Clear database
 */
Employee.clearData = async function () {
  if (confirm("Do you really want to delete all employee records?")) {
    try {
      const employeesCollRef = fsColl( fsDb, "employees");
      console.log("Clearing test data...");
      const employeeQrySns = (await getDocs( employeesCollRef));
      await Promise.all( employeeQrySns.docs.map( d => Employee.destroy( d.id)))
      console.log(`${employeeQrySns.docs.length} employee records deleted.`);
    } catch (e) {
      console.error(`${e.constructor.name}: ${e.message}`);
    }
  }
};
/*******************************************
 *** Non specific use case procedures ******
 ********************************************/
/**
 * Handle DB-UI synchronization
 * @param employeeId {number}
 * @returns {function}
 */
Employee.observeChanges = async function (employeeId) {
  try {
    // listen document changes, returning a snapshot (snapshot) on every change
    const employeeDocRef = fsDoc( fsDb, "employees", employeeId).withConverter( Employee.converter);
    const employeeRec = (await getDoc( employeeDocRef)).data();
    return onSnapshot( employeeDocRef, function (snapshot) {
      // create object with original document data
      const originalData = { itemName: "employee", description: `${employeeRec.firstName} ${employeeRec.lastName} (Employee ID: ${employeeRec.employeeId })`};
      if (!snapshot.data()) { // removed: if snapshot has no data
        originalData.type = "REMOVED";
        createModalFromChange( originalData); // invoke modal window reporting change of original data
      } else if (JSON.stringify( employeeRec) !== JSON.stringify( snapshot.data())) {
        originalData.type = "MODIFIED";
        createModalFromChange( originalData); // invoke modal window reporting change of original data
      }
    });
  } catch (e) {
    console.error(`${e.constructor.name} : ${e.message}`);
  }
}

export default Employee;
export { GenderEL, TherapyEL };
