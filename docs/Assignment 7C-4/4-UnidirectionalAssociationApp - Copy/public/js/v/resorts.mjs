/**
 * @fileOverview  Contains various view functions for managing books
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 */
/***************************************************************
 Import classes, data types and utility procedures
 ***************************************************************/
import {handleAuthentication} from "./accessControl.mjs";
import Employee, {GenderEL, TherapyEL} from "../m/Employee.mjs";
import Resort from "../m/Resort.mjs";
import {createListFromMap, createMultiSelectionWidget, hideProgressBar, showProgressBar} from "../../lib/util.mjs";

/***************************************************************
 Setup and handle UI Access Control
 ***************************************************************/
handleAuthentication();

/***************************************************************
 Declare variables for accessing main UI elements
 ***************************************************************/
const resortMSectionEl = document.getElementById("Resort-M"),
  resortRSectionEl = document.getElementById("Resort-R"),
  resortCSectionEl = document.getElementById("Resort-C"),
  resortUSectionEl = document.getElementById("Resort-U"),
  resortDSectionEl = document.getElementById("Resort-D");

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
 * Use case Retrieve/List All Resorts
 **********************************************/
// initialize pagination mapping references
let cursor = null,
  previousPageRef = null,
  nextPageRef = null,
  startAtRefs = [];
let order = "resortId"; // default order value
const tableBodyEl = resortRSectionEl.querySelector("table > tbody");
const selectOrderEl = resortRSectionEl.querySelector("div > label > select"),
  previousBtnEl = document.getElementById("previousPage"),
  nextBtnEl = document.getElementById("nextPage");
/**
 * event handler for main menu button
 */
document.getElementById("RetrieveAndListAll")
  .addEventListener("click", async function () {
    resortMSectionEl.hidden = true;
    resortRSectionEl.hidden = false;
    await createBlock();
    startAtRefs.push( cursor); // set "first" startAt page reference
    previousBtnEl.disabled = true;
  });
/**
 * create listing page
 */
async function createBlock (startAt) {
  tableBodyEl.innerHTML = "";
  showProgressBar( "Resort-R");
  const resortRecs = await Resort.retrieveBlock({"order": order, "cursor": startAt});
  if (resortRecs.length) {
    // set page references for current (cursor) page
    cursor = resortRecs[0][order];
    // set next startAt page reference, if not next page, assign "null" value
    nextPageRef = (resortRecs.length < 21) ? null : resortRecs[resortRecs.length - 1][order];

    for (const resortRec of resortRecs) {

      const result = {};
      for (const therapistId of resortRec.therapistIdRefs) {
        result[therapistId] = await Employee.retrieve("" + therapistId);
      }
      const manager = await Employee.retrieve("" + resortRec.manager_id);

      const rehaList = resortRec.availableRehas;

      const rehasListEl = document.createElement("ul");
      for (const reha of rehaList) {
        const listItemEl = document.createElement("li");
        listItemEl.textContent = TherapyEL.labels[reha-1];
        rehasListEl.appendChild( listItemEl);
      }
      const therapistListEl = createListFromMap( result, "firstName", "lastName");

      const row = tableBodyEl.insertRow(-1);
      row.insertCell(-1).textContent = resortRec.resortId;
      row.insertCell(-1).textContent = resortRec.city;
      row.insertCell(-1).textContent = manager.firstName + " " + manager.lastName;
      row.insertCell(-1).appendChild( therapistListEl);
      row.insertCell(-1).appendChild( rehasListEl);
    }
  }
  hideProgressBar( "Resort-R");
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
 * Use case Create Resort
 **********************************************/
const createFormEl = resortCSectionEl.querySelector("form");

const createTherapistWidget = createFormEl.querySelector(".MultiSelectionWidget");
await createMultiSelectionWidget (createFormEl, [], "therapists",
  "id", "employeeId", Resort.checkTherapistIdRef, Employee.retrieve);

document.getElementById("Create").addEventListener("click", async function () {
  createFormEl.reset();
  resortMSectionEl.hidden = true;
  resortCSectionEl.hidden = false;
});
// set up event handlers for responsive constraint validation
createFormEl["city"].addEventListener("input", function () {
  this.setCustomValidity(Resort.checkCity( this.value).message);
});

createFormEl["manager"].addEventListener("input", function () {
  this.setCustomValidity(Resort.checkManagerId( this.value).message);
});

// handle Create button click events
createFormEl["commit"].addEventListener("click", async function () {
  if (!createFormEl["resortId"].value) return;

  const addedTherapistsListEl = createTherapistWidget.children[1], // ul
    slots = {
    resortId: createFormEl["resortId"].value,
    city: createFormEl["city"].value,
    manager_id: createFormEl["manager"].value,
    therapistIdRefs: [],
  };
  // check all input fields and show error messages
  createFormEl["resortId"].setCustomValidity(
    (await Resort.checkResortIdAsId( slots.resortId)).message);

  createFormEl["city"].setCustomValidity( Resort.checkCity( slots.city).message);

  const responseValidation = await Resort.checkManagerIdAsIdRef( slots.manager_id);
  createFormEl["manager"].setCustomValidity( responseValidation.message);

  let availRehas = [];
  if (addedTherapistsListEl.children.length) {
    for (const therapistItemEl of addedTherapistsListEl.children) {
      const therapist = JSON.parse(therapistItemEl.getAttribute("data-value"));
      const responseValidation = await Employee.checkEmployeeIdAsIdRef(therapist.id);
      if (responseValidation.message) {
        createFormEl["therapists"].setCustomValidity(responseValidation.message);
        break;
      } else {
        slots.therapistIdRefs.push(parseInt(therapist.id));

        for(const therapy of therapist.therapySkills) {
          if(! availRehas.includes(therapy)) {
            availRehas.push(therapy);
          }
        }
        slots.availableRehas = availRehas;

        createFormEl["therapists"].setCustomValidity("");
      }
    }
  }
  // save the input data only if all form fields are valid
  if (createFormEl.checkValidity()) {
    showProgressBar("Resort-C");
    await Resort.add( slots);
    createFormEl.reset();
    addedTherapistsListEl.innerHTML = "";
    hideProgressBar( "Resort-C");
  }
});

/**********************************************
 * Use case Update Resort
 **********************************************/
const updateFormEl = resortUSectionEl.querySelector("form"),
  updateTherapistWidget = updateFormEl.querySelector(".MultiSelectionWidget");

document.getElementById("Update").addEventListener("click", async function () {
  resortMSectionEl.hidden = true;
  resortUSectionEl.hidden = false;
  updateFormEl.reset();
  updateTherapistWidget.innerHTML = "";
});
/**
 * handle resort ID input: when a resort ID is entered, and the
 * user changes focus, the form is populated with the resort's data
 */

// set up event handlers for responsive constraint validation
updateFormEl["city"].addEventListener("input", function () {
  this.setCustomValidity(Resort.checkCity( this.value).message);
});

updateFormEl["manager"].addEventListener("input", function () {
  this.setCustomValidity(Resort.checkManagerId( this.value).message);
});


updateFormEl["resortId"].addEventListener("input", async function () {
  const responseValidation = await Resort.checkResortIdAsIdRef( updateFormEl["resortId"].value);
  if (responseValidation) updateFormEl["resortId"].setCustomValidity( responseValidation.message);
  if (!updateFormEl["resortId"].value) {
    updateFormEl.reset();
    updateTherapistWidget.innerHTML = "";
  }
});
updateFormEl["resortId"].addEventListener("blur", async function () {
  if (updateFormEl["resortId"].checkValidity() && updateFormEl["resortId"].value) {
    const resortRec = await Resort.retrieve( updateFormEl["resortId"].value);
    updateFormEl["resortId"].value = resortRec.resortId;
    updateFormEl["city"].value = resortRec.city;

    if (resortRec.manager_id) updateFormEl["manager"].value = resortRec.manager_id;

    updateTherapistWidget.innerHTML = "";

    await createMultiSelectionWidget (updateFormEl, resortRec.therapistIdRefs,
      "therapists", "id", "employeeId",
        Resort.checkTherapistIdRef, Employee.retrieve);
  } else {
    updateFormEl.reset();
  }
});
// handle Update button click events
updateFormEl["commit"].addEventListener("click", async function () {
  if (!updateFormEl["resortId"].value) return;
  const addedTherapistsListEl = updateTherapistWidget.children[1], // ul
    slots = {
      resortId: updateFormEl["resortId"].value,
      city: updateFormEl["city"].value,
      manager_id: updateFormEl["manager"].value,
    };

  updateFormEl["city"].setCustomValidity(
      Resort.checkCity( slots.city).message);

  const responseValidation = await Resort.checkManagerIdAsIdRef( slots.manager_id);
  updateFormEl["manager"].setCustomValidity( responseValidation.message);

  if (addedTherapistsListEl.children.length) {
    // construct therapistIdRefs-ToAdd/ToRemove lists
    const therapistIdRefsToAdd=[],therapistIdRefsToRemove=[];
    for (const therapistItemEl of addedTherapistsListEl.children) {
      if (therapistItemEl.classList.contains("added")) {
        const therapist = JSON.parse(therapistItemEl.getAttribute("data-value"));
        const responseValidation = await Employee.checkEmployeeIdAsIdRef( therapist.id);
        if (responseValidation.message) {
          updateFormEl["therapists"].setCustomValidity( responseValidation.message);
          break;
        } else {
          therapistIdRefsToAdd.push( therapist);
          updateFormEl["therapists"].setCustomValidity( "");
        }
      }
      if (therapistItemEl.classList.contains("removed")) {
        const therapist = JSON.parse(therapistItemEl.getAttribute("data-value"));
        therapistIdRefsToRemove.push( therapist);
      }
    }
    // if the add/remove list is non-empty, create a corresponding slot
    if (therapistIdRefsToRemove.length > 0) {
      slots.therapistIdRefsToRemove = therapistIdRefsToRemove;
    }
    if (therapistIdRefsToAdd.length > 0) {
      slots.therapistIdRefsToAdd = therapistIdRefsToAdd;
    }
  }
  updateFormEl.reportValidity();
  // commit the update only if all form field values are valid
  if (updateFormEl.checkValidity()) {
    showProgressBar( "Resort-U");
    await Resort.update( slots);
    // drop widget content
    updateFormEl.reset();
    updateTherapistWidget.innerHTML = ""; // ul
    hideProgressBar( "Resort-U");
  }
});

/**********************************************
 * Use case Delete Resort
 **********************************************/
const deleteFormEl = resortDSectionEl.querySelector("form");
document.getElementById("Delete").addEventListener("click", async function () {
  deleteFormEl.reset();
  resortMSectionEl.hidden = true;
  resortDSectionEl.hidden = false;
});
deleteFormEl["resortId"].addEventListener("input", async function () {
  const responseValidation = await Resort.checkResortIdAsIdRef( deleteFormEl["resortId"].value);
  deleteFormEl["resortId"].setCustomValidity( responseValidation.message);
});
// commit delete only if all form field values are valid
if (deleteFormEl.checkValidity()) {
  // handle Delete button click events
  deleteFormEl["commit"].addEventListener("click", async function () {
    const resortIdRef = deleteFormEl["resortId"].value;
    if (!resortIdRef) return;
    if (confirm("Do you really want to delete this resort?")) {
      await Resort.destroy(resortIdRef);
      deleteFormEl.reset();
    }
  });
}

/**********************************************
 * Refresh the Manage Resort Data UI
 **********************************************/
function refreshManageDataUI() {
  // show the manage resort UI and hide the other UIs
  resortMSectionEl.hidden = false;
  resortRSectionEl.hidden = true;
  resortCSectionEl.hidden = true;
  resortUSectionEl.hidden = true;
  resortDSectionEl.hidden = true;
}

/** Retrieve data and set up the resort management UI */
// set up Manage Resort UI
refreshManageDataUI();
