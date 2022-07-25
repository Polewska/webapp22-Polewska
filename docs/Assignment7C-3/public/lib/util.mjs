/**
 * @fileOverview  Defines utility procedures/functions
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 */
/**
 * Verifies if a value represents an integer
 * @param {string} x
 * @return {boolean}
 */
function isNonEmptyString(x) {
  return typeof(x) === "string" && x.trim() !== "";
}

/**
 * Verifies if a value represents an integer or integer string
 * @param {string} x
 * @return {boolean}
 */
function isIntegerOrIntegerString(x) {
  return typeof(x) === "number" && Number.isInteger(x) ||
    typeof(x) === "string" && x.search(/^-?[0-9]+$/) === 0;
}
/**
 * Creates a "clone" of an object that is an instance of a model class
 *
 * @param {object} obj
 */
function cloneObject( obj) {
  let p="", val,
    clone = Object.create( Object.getPrototypeOf(obj));
  for (p in obj) {
    if (obj.hasOwnProperty(p)) {
      val = obj[p];
      if (typeof val === "number" ||
        typeof val === "string" ||
        typeof val === "boolean" ||
        val instanceof Date ||
        // typed object reference
        typeof val === "object" && !!val.constructor ||
        // list of data values
        Array.isArray( val) &&
        !val.some( function (el) {
          return typeof el === "object";
        }) ||
        // list of typed object references
        Array.isArray( val) &&
        val.every( function (el) {
          return (typeof el === "object" && !!el.constructor);
        })
      ) {
        if (Array.isArray( val)) clone[p] = val.slice(0);
        else clone[p] = val;
      }
      // else clone[p] = cloneObject(val);
    }
  }
  return clone;
}
/**
 * Create a DOM option element
 * @param {string} val
 * @param {string} txt
 * @param {string} classValues [optional]
 * @return {object}
 */
function createOption( val, txt, classValues) {
  const el = document.createElement("option");
  el.value = val;
  el.text = txt || val;
  if (classValues) el.className = classValues;
  return el;
}
/**
 * Fill a select element with option elements created from a
 * map of objects
 * @param {object} selectEl  A select(ion list) element
 * @param {array} selectionRange  An array list
 * @param {object} optPar [optional]  An optional parameter record including
 *     optPar.displayProp, optPar.valueProp and optPar.selection
 */
function fillSelectWithOptions( selectEl, selectionRange, optPar) {
  // create option elements from array key and values
  const options = selectionRange.entries();
  // delete old contents
  selectEl.innerHTML = "";
  // create "no selection yet" entry
  if (!selectEl.multiple) {
    selectEl.add( createOption(""," --- "));
  }
  //
  for (const [index, o] of options) {
    const key = index + 1;
    const optionEl = createOption(
        optPar ? (o[optPar.valueProp] ? o[optPar.valueProp] : key) : key,
        optPar ? (o[optPar.displayProp] ? o[optPar.displayProp] + (o[optPar.displayProp2] ? " " + o[optPar.displayProp2] : "") : o) : o
    );
    if (selectEl.multiple && optPar && optPar.selection &&
      optPar.selection.includes(key)) {
      // flag the option element with this value as selected
      optionEl.selected = true;
    }
    selectEl.add( optionEl);
  }
}
/**
 * * Create a choice control (radio button or checkbox) element
 * @param {string} t  The type of choice control ("radio" or "checkbox")
 * @param {string} n  The name of the choice control input element
 * @param {string} v  The value of the choice control input element
 * @param {string} lbl  The label text of the choice control
 * @return {object}
 */
function createLabeledChoiceControl( t,n,v,lbl) {
  const ccEl = document.createElement("input"),
    lblEl = document.createElement("label");
  ccEl.type = t;
  ccEl.name = n;
  ccEl.value = v;
  lblEl.appendChild( ccEl);
  lblEl.appendChild( document.createTextNode( lbl));
  return lblEl;
}
/**
 * Create a choice widget in a given fieldset element.
 * A choice element is either an HTML radio button or an HTML checkbox.
 * @param containerEl
 * @param fld
 * @param values
 * @param choiceWidgetType
 * @param choiceItems
 * @param isMandatory
 * @returns {*}
 */
function createChoiceWidget( containerEl, fld, values,
                             choiceWidgetType, choiceItems, isMandatory) {
  const choiceControls = containerEl.querySelectorAll("label");
  // remove old content
  for (const j of choiceControls.keys()) {
    containerEl.removeChild( choiceControls[j]);
  }
  if (!containerEl.hasAttribute("data-bind")) {
    containerEl.setAttribute("data-bind", fld);
  }
  // for a mandatory radio button group initialze to first value
  if (choiceWidgetType === "radio" && isMandatory && values.length === 0) {
    values[0] = 1;
  }
  if (values.length >= 1) {
    if (choiceWidgetType === "radio") {
      containerEl.setAttribute("data-value", values[0]);
    } else {  // checkboxes
      containerEl.setAttribute("data-value", "["+ values.join() +"]");
    }
  }
  for (const j of choiceItems.keys()) {
    // button values = 1..n
    const el = createLabeledChoiceControl( choiceWidgetType, fld,
      j+1, choiceItems[j]);
    // mark the radio button or checkbox as selected/checked
    if (values.includes(j+1)) el.firstElementChild.checked = true;
    containerEl.appendChild( el);
    el.firstElementChild.addEventListener("click", function (e) {
      const btnEl = e.target;
      if (choiceWidgetType === "radio") {
        if (containerEl.getAttribute("data-value") !== btnEl.value) {
          containerEl.setAttribute("data-value", btnEl.value);
        } else if (!isMandatory) {
          // turn off radio button
          btnEl.checked = false;
          containerEl.setAttribute("data-value", "");
        }
      } else {  // checkbox
        let values = JSON.parse( containerEl.getAttribute("data-value")) || [];
        let i = values.indexOf( parseInt( btnEl.value));
        if (i > -1) {
          values.splice(i, 1);  // delete from value list
        } else {  // add to value list
          values.push( btnEl.value);
        }
        containerEl.setAttribute("data-value", "["+ values.join() +"]");
      }
    });
  }
  return containerEl;
}
/**
 * Show progress bar element
 * @param {object} progressEl
 */
function showProgressBar (progressEl) {
  progressEl.hidden = false;
}
/**
 * Hide progress bar element
 * @param {object} progressEl
 */
function hideProgressBar (progressEl) {
  progressEl.hidden = true;
}
/**
 * Handle messages in modal window for listened change in item
 * @param change: {object}
 */
function createModalFromChange (change) {
  const { itemName, description, type } = change,
    divModalWindowEl = document.querySelector("#modal-window"),
    divModalContentEl = divModalWindowEl.querySelector("div"),
    pEl = document.createElement("p"),
    btnEl = document.createElement("button");
  divModalContentEl.innerHTML = "";
  pEl.textContent = `The selected ${itemName} "${description}" has been ${type} by another user.`;
  btnEl.type = "button";
  btnEl.textContent = "Reload this page to continue";
  btnEl.addEventListener( "click", () => location.reload());
  divModalContentEl.appendChild( pEl);
  divModalContentEl.appendChild( btnEl);
  divModalWindowEl.appendChild( divModalContentEl);
  divModalWindowEl.classList.add("show-modal");
}

export { isNonEmptyString, isIntegerOrIntegerString, createOption,
  fillSelectWithOptions, createChoiceWidget, showProgressBar, hideProgressBar,
  createModalFromChange };
