/**
 * @fileOverview  Contains various view functions for managing employees
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 */
/***************************************************************
 Import classes, data types and utility procedures
 ***************************************************************/
import { handleAuthentication } from "./accessControl.mjs";
import Employee, { GenderEL, TherapyEL} from "../m/Employee.mjs";
import { hideProgressBar, showProgressBar, createChoiceWidget }
  from "../../lib/util.mjs";
import Resort from "../m/Resort.mjs";

/***************************************************************
 Setup and handle UI Access Control
 ***************************************************************/
handleAuthentication();

/***************************************************************
 Declare variables for accessing main UI elements
 ***************************************************************/
const employeeMSectionEl = document.getElementById("Employee-M"),
    employeeRSectionEl = document.getElementById("Employee-R"),
    employeeCSectionEl = document.getElementById("Employee-C"),
    employeeUSectionEl = document.getElementById("Employee-U"),
    employeeDSectionEl = document.getElementById("Employee-D");

/***************************************************************
 Set up general use-case-independent event listeners
 ***************************************************************/
// set up back-to-menu buttons for all use cases
for (const btn of document.querySelectorAll("button.back-to-menu")) {
  btn.addEventListener("click", refreshManageDataUI);
}
// neutralize the submit event for all use cases
for (const frm of document.querySelectorAll("section > form")) {
  frm.addEventListener("submit", function (e) {
    e.preventDefault();
  });
}

/**********************************************
 * Use case Retrieve/List All Employees
 **********************************************/
// initialize pagination mapping references
let cursor = null,
  previousPageRef = null,
  nextPageRef = null,
  startAtRefs = [];
let order = "employeeId"; // default order value
const tableBodyEl = employeeRSectionEl.querySelector("table > tbody");
const selectOrderEl = employeeRSectionEl.querySelector("div > label > select"),
  previousBtnEl = document.getElementById("previousPage"),
  nextBtnEl = document.getElementById("nextPage");
/**
 * event handler for main menu button
 */
document.getElementById("RetrieveAndListAll")
  .addEventListener("click", async function () {
    employeeMSectionEl.hidden = true;
    employeeRSectionEl.hidden = false;
    await createBlock();
    startAtRefs.push( cursor); // set "first" startAt page reference
    previousBtnEl.disabled = true;
  });
/**
 * create listing page
 */
async function createBlock (startAt) {
  tableBodyEl.innerHTML = "";
  showProgressBar( "Employee-R");
  const employeeRecs = await Employee.retrieveBlock({"order": order, "cursor": startAt});
  if (employeeRecs.length) {
    // set page references for current (cursor) page
    cursor = employeeRecs[0][order];
    // set next startAt page reference, if not next page, assign "null" value
    nextPageRef = (employeeRecs.length < 21) ? null : employeeRecs[employeeRecs.length - 1][order];
    for (const employeeRec of employeeRecs) {
      const row = tableBodyEl.insertRow(-1);
      row.insertCell(-1).textContent = employeeRec.employeeId;
      row.insertCell(-1).textContent = employeeRec.firstName;
      row.insertCell(-1).textContent = employeeRec.lastName;
      row.insertCell(-1).textContent = employeeRec.birthdate.toLocaleDateString();

      row.insertCell().textContent = GenderEL.labels[employeeRec.gender - 1];

      row.insertCell().textContent = (!employeeRec.therapySkills) ? "" : TherapyEL.stringify( employeeRec.therapySkills);
    }
  }
  hideProgressBar( "Employee-R");
}
/**
 * "Previous" button
 */
previousBtnEl.addEventListener("click", async function () {
  // locate current page reference in index of page references
  previousPageRef = startAtRefs[startAtRefs.indexOf( cursor) - 1];
  // create new page
  await createBlock( previousPageRef);
  // disable "previous" button if cursor is first page
  if (cursor === startAtRefs[0]) previousBtnEl.disabled = true;
  // enable "next" button if cursor is not last page
  if (cursor !== startAtRefs[startAtRefs.length -1]) nextBtnEl.disabled = false;
});
/**
 *  "Next" button
 */
nextBtnEl.addEventListener("click", async function () {
  await createBlock( nextPageRef);
  // add new page reference if not present in index
  if (!startAtRefs.find( i => i === cursor)) startAtRefs.push( cursor);
  // disable "next" button if cursor is last page
  if (!nextPageRef) nextBtnEl.disabled = true;
  // enable "previous" button if cursor is not first page
  if (cursor !== startAtRefs[0]) previousBtnEl.disabled = false;
});
/**
 * handle order selection events: when an order is selected,
 * populate the list according to the selected order
 */
selectOrderEl.addEventListener("change", async function (e) {
  order = e.target.value;
  startAtRefs = [];
  await createBlock();
  startAtRefs.push( cursor);
  previousBtnEl.disabled = true;
  nextBtnEl.disabled = false;
});

/**********************************************
 * Use case Create Employee
 **********************************************/
const createFormEl = employeeCSectionEl.querySelector("form");

const genderFieldsetElCreate = createFormEl.querySelector("fieldset[data-bind='gender']");
const therapiesFieldsetElCreate = createFormEl.querySelector("fieldset[data-bind='therapies']");

document.getElementById("Create").addEventListener("click", async function () {
  createFormEl.reset();
  employeeMSectionEl.hidden = true;
  employeeCSectionEl.hidden = false;
});

/**************************
 Set up (choice) widgets
 **************************/
// set up the gender radio button group
createChoiceWidget( genderFieldsetElCreate, "gender", [],
    "radio", GenderEL.labels, true);
// set up the therapies checkbox group
createChoiceWidget( therapiesFieldsetElCreate, "therapies", [],
    "checkbox", TherapyEL.labels);


// set up event handlers for responsive constraint validation
createFormEl["employeeId"].addEventListener("input", async function () {
  const responseValidation = await Employee.checkEmployeeIdAsId( createFormEl["employeeId"].value);
  createFormEl["employeeId"].setCustomValidity( responseValidation.message);
});

createFormEl["firstName"].addEventListener("input", function () {
  this.setCustomValidity(Employee.checkFirstName( this.value).message);
});
createFormEl["lastName"].addEventListener("input", function () {
  this.setCustomValidity(Employee.checkLastName( this.value).message);
});
createFormEl["birthdate"].addEventListener("input", function () {
  this.setCustomValidity(Employee.checkBirthdate( this.value).message);
});

// handle Create button click events
createFormEl["commit"].addEventListener("click", async function () {
  if (!createFormEl["employeeId"].value) return;
  const slots = {
    employeeId: createFormEl["employeeId"].value,
    firstName: createFormEl["firstName"].value,
    lastName: createFormEl["lastName"].value,
    birthdate: createFormEl["birthdate"].value,
    gender: createFormEl["gender"].value,
    therapySkills: [],
  };
  // check all input fields and show error messages
  createFormEl["employeeId"].setCustomValidity(
    (await Employee.checkEmployeeIdAsId( slots.employeeId)).message);

  createFormEl["firstName"].setCustomValidity( Employee.checkFirstName( slots.firstName).message);
  createFormEl["firstName"].reportValidity();

  createFormEl["lastName"].setCustomValidity( Employee.checkLastName( slots.lastName).message);
  createFormEl["lastName"].reportValidity();

  createFormEl["birthdate"].setCustomValidity( Employee.checkBirthdate( slots.birthdate).message);
  createFormEl["birthdate"].reportValidity();

  // set the error message for gender constraint violations on the first radio button
  // validation of gender only on commit because no invalid input possible through UI
  createFormEl["gender"][0].setCustomValidity( Employee.checkGender( slots.gender).message);
  createFormEl["gender"][0].reportValidity();

  // set the error message for therapySkills constraint violations on the first checkbox
  // validation of therapySkills only on commit because no invalid input possible through UI
  createFormEl["therapies"][0].setCustomValidity( Employee.checkTherapySkills( slots.therapySkills).message);
  createFormEl["therapies"][0].reportValidity();

  createFormEl.reportValidity();
  // save the input data only if all form fields are valid
  if (createFormEl.checkValidity()) {
    showProgressBar("Employee-C");
    await Employee.add( slots);
    createFormEl.reset();
    hideProgressBar( "Employee-C");
  }
});

/**********************************************
 * Use case Update Employee
 **********************************************/
const updateFormEl = employeeUSectionEl.querySelector("form");

const genderFieldsetElUpdate = updateFormEl.querySelector("fieldset[data-bind='gender']");
const therapiesFieldsetElUpdate = updateFormEl.querySelector("fieldset[data-bind='therapies']");

/**************************
 Set up (choice) widgets
 **************************/
// set up the gender radio button group
createChoiceWidget( genderFieldsetElUpdate, "gender", [],
    "radio", GenderEL.labels, true);
// set up the therapies checkbox group
createChoiceWidget( therapiesFieldsetElUpdate, "therapies", [],
    "checkbox", TherapyEL.labels);


document.getElementById("Update").addEventListener("click", async function () {
  employeeMSectionEl.hidden = true;
  employeeUSectionEl.hidden = false;
  updateFormEl.reset();
});
/**
 * handle employee ID input: when an employee ID is entered, and the
 * user changes focus, the form is populated with the employee's data
 */
// set up event handlers for responsive constraint validation
updateFormEl["employeeId"].addEventListener("input", async function () {
  const responseValidation = await Employee.checkEmployeeIdAsIdRef( updateFormEl["employeeId"].value);
  if (responseValidation) updateFormEl["employeeId"].setCustomValidity( responseValidation.message);
  if (!updateFormEl["employeeId"].value) {
    updateFormEl.reset();
  }
});

updateFormEl["employeeId"].addEventListener("blur", async function () {
  if (updateFormEl["employeeId"].checkValidity() && updateFormEl["employeeId"].value) {
    const employeeRec = await Employee.retrieve( updateFormEl["employeeId"].value);
    updateFormEl["employeeId"].value = employeeRec.employeeId;
    updateFormEl["firstName"].value = employeeRec.firstName;
    updateFormEl["lastName"].value = employeeRec.lastName;
    updateFormEl["birthdate"].valueAsDate = employeeRec.birthdate;

    // set up the gender radio button group
    createChoiceWidget( genderFieldsetElUpdate, "gender",
        [employeeRec.gender], "radio", GenderEL.labels);

    // set up the therapies checkbox group
    createChoiceWidget( therapiesFieldsetElUpdate, "therapies",
        employeeRec.therapySkills, "checkbox", TherapyEL.labels);


  } else {
    updateFormEl.reset();
  }
});

updateFormEl["firstName"].addEventListener("input", function () {
  this.setCustomValidity(Employee.checkFirstName( this.value).message);
});
updateFormEl["lastName"].addEventListener("input", function () {
  this.setCustomValidity(Employee.checkLastName( this.value).message);
});
updateFormEl["birthdate"].addEventListener("input", function () {
  this.setCustomValidity(Employee.checkBirthdate( this.value).message);
});

// mandatory value check for radio button group 'gender'
genderFieldsetElUpdate.addEventListener("click", function () {
  updateFormEl["gender"][0].setCustomValidity(
      (!genderFieldsetElUpdate.getAttribute("data-value")) ?
          "A gender must be selected!":"" );
});

// handle Update button click events
updateFormEl["commit"].addEventListener("click", async function () {
  if (!updateFormEl["employeeId"].value) return;

  const slots = {
      employeeId: updateFormEl["employeeId"].value,
      firstName: updateFormEl["firstName"].value,
      lastName: updateFormEl["lastName"].value,
      birthdate: updateFormEl["birthdate"].value,

      gender: genderFieldsetElUpdate.getAttribute("data-value"),
      therapySkills: JSON.parse( therapiesFieldsetElUpdate.getAttribute("data-value"))
    };

  // check all input fields and show error messages
  updateFormEl["firstName"].setCustomValidity(
      Employee.checkFirstName( slots.firstName).message);

  updateFormEl["lastName"].setCustomValidity(
      Employee.checkLastName( slots.lastName).message);

  updateFormEl["birthdate"].setCustomValidity(
      Employee.checkBirthdate( slots.birthdate).message);

  // set the error message for gender constraint violations on the first radio button
  // validation of gender only on commit because no invalid input possible through UI
  updateFormEl["gender"][0].setCustomValidity( Employee.checkGender( slots.gender).message);

  // set the error message for therapySkills constraint violations on the first checkbox
  // validation of therapySkills only on commit because no invalid input possible through UI
  updateFormEl["therapies"][0].setCustomValidity( Employee.checkTherapySkills( slots.therapySkills).message);


  // commit the update only if all form field values are valid
  if (updateFormEl.checkValidity()) {
    showProgressBar( "Employee-U");
    await Employee.update( slots);
    // drop widget content
    updateFormEl.reset();
    hideProgressBar( "Employee-U");
  }
});

/**********************************************
 * Use case Delete Employee
 **********************************************/
const deleteFormEl = employeeDSectionEl.querySelector("form");
document.getElementById("Delete").addEventListener("click", async function () {
  deleteFormEl.reset();
  employeeMSectionEl.hidden = true;
  employeeDSectionEl.hidden = false;
});
deleteFormEl["employeeId"].addEventListener("input", async function () {
  const responseValidation = await Employee.checkEmployeeIdAsIdRef( deleteFormEl["employeeId"].value);
  deleteFormEl["employeeId"].setCustomValidity( responseValidation.message);
});
// commit delete only if all form field values are valid
if (deleteFormEl.checkValidity()) {
  // handle Delete button click events
  deleteFormEl["commit"].addEventListener("click", async function () {
    const employeeIdRef = deleteFormEl["employeeId"].value;
    if (!employeeIdRef) return;
    if (confirm("Do you really want to delete this employee?")) {
      await Employee.destroy(employeeIdRef);
      deleteFormEl.reset();
    }
  });
}

/**********************************************
 * Refresh the Manage Employees Data UI
 **********************************************/
function refreshManageDataUI() {
  // show the manage employee UI and hide the other UIs
  employeeMSectionEl.hidden = false;
  employeeRSectionEl.hidden = true;
  employeeCSectionEl.hidden = true;
  employeeUSectionEl.hidden = true;
  employeeDSectionEl.hidden = true;
}

/** Retrieve data and set up the employee management UI */
// set up Manage Employee UI
refreshManageDataUI();
