/**
 * @fileOverview  The model class Employee with attribute definitions and storage management methods
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 * @copyright Copyright 2020-2022 Gerd Wagner (Chair of Internet Technology) and Juan-Francisco Reyes,
 * Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */
import {fsDb} from "../initFirebase.mjs";
import {
  collection as fsColl,
  deleteDoc,
  doc as fsDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.8.3/firebase-firestore-lite.js";

/**
 * Constructor function for the class Employee
 * @constructor
 * @param {{employeeId: number, firstName: string, lastName: string, birthdate: Date}} slots - Object creation slots.
 */
class Employee {
  // record parameter with the ES6 syntax for function parameter destructuring
  constructor({employeeId, firstName, lastName, birthdate}) {
    this.employeeId = employeeId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthdate = birthdate;
  }
}
/*********************************************************
 ***  Class-level ("static") storage management methods **
 *********************************************************/
/**
 * Create a Firestore document in the Firestore collection "employees"
 * @param slots: {object}
 * @returns {Promise<void>}
 */
Employee.add = async function (slots) {
  console.log(slots.employeeId);
  const employeesCollRef = fsColl( fsDb, "employees");
  const employeeDocRef = fsDoc (employeesCollRef, String(slots.employeeId));
  slots.birthdate = new Date( slots.birthdate);
  try {
    await setDoc( employeeDocRef, slots);
    console.log(`Employee record ${slots.employeeId} created.`);
  } catch( e) {
    console.error(`Error when adding employee record: ${e}`);
  }
};

/**
 * Load an employee record from Firestore
 * @param employeeId: {object}
 * @returns {Promise<*>} employeeRecord: {array}
 */
Employee.retrieve = async function (employeeId) {
  let employeeDocSn = null;
  try {
    const employeeDocRef = fsDoc( fsDb, "employees", employeeId);
    employeeDocSn = await getDoc( employeeDocRef);
  } catch( e) {
    console.error(`Error when retrieving employee record: ${e}`);
    return null;
  }
  return employeeDocSn.data();
};
/**
 * Load all employee records from Firestore
 * @returns {Promise<*>} employeeRecords: {array}
 */
Employee.retrieveAll = async function () {
  let employeesQrySn = null;
  try {
    const employeesCollRef = fsColl( fsDb, "employees");
    employeesQrySn = await getDocs( employeesCollRef);
  } catch( e) {
    console.error(`Error when retrieving employee records: ${e}`);
    return null;
  }
  const employeeDocs = employeesQrySn.docs,
      employeeRecs = employeeDocs.map( d => d.data());
  console.log(`${employeeRecs.length} employee records retrieved.`);
  return employeeRecs;
};
/**
 * Update a Firestore document in the Firestore collection "employees"
 * @param slots: {object}
 * @returns {Promise<void>}
 */
Employee.update = async function (slots) {
  const updSlots = {};
  // retrieve up-to-date employee record
  const employeeRec = await Employee.retrieve( slots.employeeId);
  if (slots.birthdate) slots.birthdate = new Date( slots.birthdate);

  // update only those slots that have changed
  if (employeeRec.firstName !== slots.firstName) updSlots.firstName = slots.firstName;
  if (employeeRec.lastName !== slots.lastName) updSlots.lastName = slots.lastName;
  if (employeeRec.birthdate !== slots.birthdate) updSlots.birthdate = slots.birthdate;
  if (Object.keys( updSlots).length > 0) {
    try {
      const employeeDocRef = fsDoc( fsDb, "employees", slots.employeeId);
      await updateDoc( employeeDocRef, updSlots);
      console.log(`Employee record ${slots.employeeId} modified.`);
    } catch( e) {
      console.error(`Error when updating employee record: ${e}`);
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
    await deleteDoc( fsDoc( fsDb, "employees", employeeId));
    console.log(`Employee record ${employeeId} deleted.`);
  } catch( e) {
    console.error(`Error when deleting employee record: ${e}`);
  }
};
/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
/**
 * Create test data
 */
Employee.generateTestData = async function () {
  let employeeRecs = [
    {
      employeeId: 1,
      firstName: "John",
      lastName: "Doe",
      birthdate: new Date(Date.UTC(1978,9,12))
    },
    {
      employeeId: 2,
      firstName: "Jane",
      lastName: "Smith",
      birthdate: new Date(Date.UTC(1970,1,10))
    },
    {
      employeeId: 3,
      firstName: "Keith",
      lastName: "Johnson",
      birthdate: new Date(Date.UTC(1989,2,2))
    }
  ];
  // save all employee record/documents
  await Promise.all( employeeRecs.map( d => Employee.add( d)));
  console.log(`${Object.keys( employeeRecs).length} employee records saved.`);
};
/**
 * Clear database
 */
Employee.clearData = async function () {
  if (confirm("Do you really want to delete all employee records?")) {
    // retrieve all employee documents from Firestore
    const employeeRecs = await Employee.retrieveAll();
    // delete all documents
    await Promise.all( employeeRecs.map( d => Employee.destroy( String( d.employeeId))));
    // ... and then report that they have been deleted
    console.log(`${Object.values( employeeRecs).length} employee records deleted.`);
  }
};

export default Employee;