/**
 * @fileOverview  View code of UI for managing Director data
 * @author Gerd Wagner
 * @copyright Copyright 2013-2021 Gerd Wagner, Chair of Internet Technology, Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */
/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import Director from "../m/Director.mjs";
import Person from "../m/Person.mjs";
import { fillSelectWithOptions } from "../../lib/util.mjs";

/***************************************************************
 Load data
 ***************************************************************/
Director.retrieveAll();

/***************************************************************
 Set up general, use-case-independent UI elements
 ***************************************************************/
// set up back-to-menu buttons for all use cases
for (const btn of document.querySelectorAll("button.back-to-menu")) {
  btn.addEventListener("click", refreshManageDataUI);
}
// neutralize the submit event for all use cases
for (const frm of document.querySelectorAll("section > form")) {
  frm.addEventListener("submit", function (e) {
    e.preventDefault();
    frm.reset();
  });
}
// save data when leaving the page
window.addEventListener("beforeunload", function () {
  Director.saveAll();
});

/**********************************************
 * Use case Retrieve/List Director
 **********************************************/
document
  .getElementById("RetrieveAndListAll")
  .addEventListener("click", function () {
    const tableBodyEl = document.querySelector(
      "section#Director-R > table > tbody"
    );
    // reset view table (drop its previous contents)
    tableBodyEl.innerHTML = "";
    // populate view table
    for (const key of Object.keys(Director.instances)) {
      const director = Director.instances[key];
      const row = tableBodyEl.insertRow();
      row.insertCell().textContent = director.personId;
      row.insertCell().textContent = director.name;
    }
    document.getElementById("Director-M").style.display = "none";
    document.getElementById("Director-R").style.display = "block";
  });

/**********************************************
 * Use case Create Director
 **********************************************/
const createFormEl = document.querySelector("section#Director-C > form");
//----- set up event handler for menu item "Create" -----------
document.getElementById("Create").addEventListener("click", function () {
  document.getElementById("Director-M").style.display = "none";
  document.getElementById("Director-C").style.display = "block";
  createFormEl.reset();
});
// set up event handlers for responsive constraint validation
createFormEl.personId.addEventListener("input", function () {
  createFormEl.personId.setCustomValidity(
    Person.checkPersonIdAsId(createFormEl.personId.value, Director).message
  );
});
createFormEl.personId.addEventListener("input", function () {
  createFormEl.name.setCustomValidity(
    Person.checkName(createFormEl.name.value).message
  );
});
/**
 * handle save events
 */
createFormEl["commit"].addEventListener("click", function () {
  const slots = {
    personId: createFormEl.personId.value,
    name: createFormEl.name.value,
  };
  // check all input fields and show error messages
  createFormEl.personId.setCustomValidity(
    Person.checkPersonIdAsId(slots.personId).message,
    Director
  );
  createFormEl.name.setCustomValidity(
    Person.checkName(createFormEl.name.value).message
  );
  // save the input data only if all form fields are valid
  if (createFormEl.checkValidity()) Director.add(slots);
});

/**********************************************
 * Use case Update Director
 **********************************************/
const updateFormEl = document.querySelector("section#Director-U > form");
const updSelDirectorEl = updateFormEl.selectDirector;
// handle click event for the menu item "Update"
document.getElementById("Update").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  updSelDirectorEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions(updSelDirectorEl, Director.instances, "personId", {
    displayProp: "name",
  });
  document.getElementById("Director-M").style.display = "none";
  document.getElementById("Director-U").style.display = "block";
  updateFormEl.reset();
});
// handle change events on director  select element
updSelDirectorEl.addEventListener("change", handleDirectorSelectChangeEvent);

// handle Save button click events
updateFormEl["commit"].addEventListener("click", function () {
  const directorIdRef = updSelDirectorEl.value;
  if (!directorIdRef) return;
  const slots = {
    personId: updateFormEl.personId.value,
    name: updateFormEl.name.value,
  };
  // check all property constraints
  createFormEl.name.setCustomValidity(
    Person.checkName(createFormEl.name.value).message
  );
  // save the input data only if all of the form fields are valid
  if (updSelDirectorEl.checkValidity()) {
    Director.update(slots);
    // update the director selection list's option element
    updSelDirectorEl.options[updSelDirectorEl.selectedIndex].text = slots.name;
  }
});
/**
 * handle director selection events
 * when a director is selected, populate the form with the data of the selected director
 */
function handleDirectorSelectChangeEvent() {
  const key = updSelDirectorEl.value;
  if (key) {
    const direct = Director.instances[key];
    updateFormEl.personId.value = direct.personId;
    updateFormEl.name.value = direct.name;
  } else {
    updateFormEl.reset();
  }
}

/**********************************************
 * Use case Delete Director
 **********************************************/
const deleteFormEl = document.querySelector("section#Director-D > form");
const delSelDirectorEl = deleteFormEl.selectDirector;
//----- set up event handler for Update button -------------------------
document.getElementById("Delete").addEventListener("click", function () {
  // reset selection list (drop its previous contents)
  delSelDirectorEl.innerHTML = "";
  // populate the selection list
  fillSelectWithOptions(delSelDirectorEl, Director.instances, "personId", {
    displayProp: "name",
  });
  document.getElementById("Director-M").style.display = "none";
  document.getElementById("Director-D").style.display = "block";
  deleteFormEl.reset();
});
// handle Delete button click events
deleteFormEl["commit"].addEventListener("click", function () {
  const personIdRef = delSelDirectorEl.value;
  if (!personIdRef) return;
  if (confirm("Do you really want to delete this director?")) {
    Director.destroy(personIdRef);
    delSelDirectorEl.remove(delSelDirectorEl.selectedIndex);
  }
});

/**********************************************
 * Refresh the Manage Director Data UI
 **********************************************/
function refreshManageDataUI() {
  // show the manage Director UI and hide the other UIs
  document.getElementById("Director-M").style.display = "block";
  document.getElementById("Director-R").style.display = "none";
  document.getElementById("Director-C").style.display = "none";
  document.getElementById("Director-U").style.display = "none";
  document.getElementById("Director-D").style.display = "none";
}

// Set up Manage Director UI
refreshManageDataUI();
