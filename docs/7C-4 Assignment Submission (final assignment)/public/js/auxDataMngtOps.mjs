/**
 * @fileOverview  Auxiliary data management procedures
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 */
import { fsDb } from "./initFirebase.mjs";
import { collection as fsColl, getDocs, orderBy }
  from "https://www.gstatic.com/firebasejs/9.8.3/firebase-firestore.js";
import Employee from "./m/Employee.mjs";
import Resort from "./m/Resort.mjs";

/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
/**
 *  Load and save test data
 */
async function generateTestData () {
  try {
    let response;
    console.log("Generating employee records...");
    response = await fetch( "../../test-data/employees.json");
    const employeeRecs = await response.json();
    await Promise.all( employeeRecs.map( d => Employee.add( d)));
    console.log(`${employeeRecs.length} employee records generated`);

    console.log("Generating resort records...");
    response = await fetch( "../../test-data/resorts.json");
    const resortRecs = await response.json();
    await Promise.all( resortRecs.map( d => Resort.add( d)));
    console.log(`${resortRecs.length} resort records saved.`);

  } catch (e) {
    console.error(`${e.constructor.name}: ${e.message}`);
  }
}
/**
 * Clear data
 */
async function clearData () {
  try {
    if (confirm("Do you really want to delete all test data?")) {
      console.log("Clearing resort records...");
      const resortsCollRef = fsColl( fsDb, "resorts");
      const resortQrySns = (await getDocs( resortsCollRef, orderBy( "resortId")));
      await Promise.all( resortQrySns.docs.map( d => Resort.destroy( d.id)))
      console.log(`${resortQrySns.docs.length} resort records deleted.`);

      console.log("Clearing employee records...");
      const employeesCollRef = fsColl( fsDb, "employees");
      const employeeQrySns = (await getDocs( employeesCollRef, orderBy( "employeeId")));
      await Promise.all( employeeQrySns.docs.map( d => Employee.destroy( d.id)))
      console.log(`${employeeQrySns.docs.length} employee records deleted.`);
    }
  } catch (e) {
    console.error(`${e.constructor.name}: ${e.message}`);
  }
}

export { generateTestData, clearData };
