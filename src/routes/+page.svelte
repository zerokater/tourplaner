<script>
  import { toursAndDrivers } from './data.js';
  import { db } from '$lib/firebaseConfig'; // Firebase configuration
  import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
  import { onMount } from 'svelte';

  let rows = [];

  let focusedCell = { rowIndex: null, dayIndex: null, isTour: false, isDriver: false, isMonthCell: false, isArbeitstagen: false };

  // Fetch data from Firebase Firestore on mount
  onMount(async () => {
    const querySnapshot = await getDocs(collection(db, "toursAndDrivers"));
    querySnapshot.forEach((doc) => {
      const rowData = doc.data();
      rows.push({
        id: doc.id,
        TOUR: rowData.TOUR,
        ARBEITSTAGEN: rowData.ARBEITSTAGEN,
        DRIVER: rowData.DRIVER,
        MONTH: rowData.MONTH,
        days: rowData.days
      });
    });
  });

  // Save new row data to Firestore
  async function saveRowToFirestore(row) {
    try {
      const docRef = await addDoc(collection(db, "toursAndDrivers"), row);
      row.id = docRef.id; // Add the document ID to the row after saving
      console.log("Document successfully written!");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  // Update existing row in Firestore
  async function updateRowInFirestore(rowId, updatedRow) {
    const rowRef = doc(db, "toursAndDrivers", rowId);
    try {
      await updateDoc(rowRef, updatedRow);
      console.log("Document successfully updated!");
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  }

  // Delete a row in Firestore
  async function deleteRowFromFirestore(rowId) {
    const rowRef = doc(db, "toursAndDrivers", rowId);
    try {
      await deleteDoc(rowRef);
      console.log("Document successfully deleted!");
    } catch (e) {
      console.error("Error deleting document: ", e);
    }
  }

  function handleKeydown(event) {
    if (focusedCell.rowIndex !== null) {
      const { rowIndex, dayIndex, isTour, isDriver, isMonthCell, isArbeitstagen } = focusedCell;

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        handleArrowKeyNavigation(event.key, rowIndex, dayIndex, isTour, isDriver, isMonthCell, isArbeitstagen);
        return;
      }

      if (isTour || isDriver) {
        return; // Do not apply key events for TOUR or DRIVER columns
      }

      if (isMonthCell) {
        handleMonthKeydown(event.key, rowIndex);
      } else if (isArbeitstagen) {
        handleArbeitstagenKeydown(event.key, rowIndex);
      } else {
        handleDayKeydown(event.key, rowIndex, dayIndex);
      }

      updateRowInFirestore(rows[rowIndex].id, rows[rowIndex]); // Save the updated row to Firestore
    }
  }

  function handleArbeitstagenKeydown(key, rowIndex) {
    switch (key.toUpperCase()) {
      case "M":
        rows[rowIndex].ARBEITSTAGEN = "Mo - Fr";
        break;
      case "D":
        rows[rowIndex].ARBEITSTAGEN = "Di - Fr";
        break;
      case "S":
        rows[rowIndex].ARBEITSTAGEN = "Sa";
        break;
      default:
        break;
    }
  }

  function handleDayKeydown(key, rowIndex, dayIndex) {
    let newDays = [...rows[rowIndex].days];

    switch (key.toUpperCase()) {
      case "A":
        newDays[dayIndex] = { letter: "A", color: "#add8e6" };
        break;
      case "F":
        newDays[dayIndex] = { letter: "F", color: "#90ee90" };
        break;
      case "X":
        newDays[dayIndex] = { letter: "X", color: "#ff6347" };
        break;
      case "S":
        newDays[dayIndex] = { letter: "S", color: "#ffa500" };
        break;
      case "K":
        newDays[dayIndex] = { letter: "K", color: "#9370db" };
        break;
      default:
        break;
    }

    rows[rowIndex].days = newDays;
  }

  function handleMonthKeydown(key, rowIndex) {
    if (key >= "1" && key <= "9") {
      rows[rowIndex].MONTH = key; // Set month directly from 1 to 9
    } else if (key === "0") {
      rows[rowIndex].MONTH = "10"; // Allow month to be set to 10
    } else if (key.toUpperCase() === "N") {
      rows[rowIndex].MONTH = "11"; // Allow month to be set to 11
    } else if (key.toUpperCase() === "D") {
      rows[rowIndex].MONTH = "12"; // Allow month to be set to 12
    }
  }

  function insertRowUnder(index) {
    const newRow = {
      TOUR: "",
      ARBEITSTAGEN: "",
      DRIVER: "",
      MONTH: "",
      days: Array(31).fill({ letter: "", color: "" }),
    };
    rows = [
      ...rows.slice(0, index + 1),
      newRow,
      ...rows.slice(index + 1),
    ];
    saveRowToFirestore(newRow); // Save new row to Firestore
  }

  function deleteRow(index) {
    const rowId = rows[index].id;
    rows = rows.filter((_, i) => i !== index);
    deleteRowFromFirestore(rowId); // Delete the row from Firestore
  }

  function addRow() {
    const newRow = { TOUR: "", ARBEITSTAGEN: "", DRIVER: "", MONTH: "", days: Array(31).fill({ letter: "", color: "" }) };
    rows = [...rows, newRow];
    saveRowToFirestore(newRow); // Save new row to Firestore
  }

  function focusCell(rowIndex, dayIndex) {
    focusedCell = { rowIndex, dayIndex, isTour: false, isDriver: false, isMonthCell: false, isArbeitstagen: false };
    const cell = document.querySelector(`[data-cell="${rowIndex}-${dayIndex}"]`);
    if (cell) {
      cell.focus();
    }
  }

  function focusArbeitstagenCell(rowIndex) {
    focusedCell = { rowIndex, dayIndex: null, isTour: false, isDriver: false, isMonthCell: false, isArbeitstagen: true };
    const cell = document.querySelector(`[data-arbeitstagen="${rowIndex}"]`);
    if (cell) {
      cell.focus();
    }
  }

  function focusMonthCell(rowIndex) {
    focusedCell = { rowIndex, dayIndex: null, isTour: false, isDriver: false, isMonthCell: true, isArbeitstagen: false };
    const cell = document.querySelector(`[data-month="${rowIndex}"]`);
    if (cell) {
      cell.focus();
    }
  }

  function focusTourCell(rowIndex) {
    focusedCell = { rowIndex, dayIndex: null, isTour: true, isDriver: false, isMonthCell: false, isArbeitstagen: false };
    const cell = document.querySelector(`[data-tour="${rowIndex}"]`);
    if (cell) {
      cell.focus();
    }
  }

  function focusDriverCell(rowIndex) {
    focusedCell = { rowIndex, dayIndex: null, isTour: false, isDriver: true, isMonthCell: false, isArbeitstagen: false };
    const cell = document.querySelector(`[data-driver="${rowIndex}"]`);
    if (cell) {
      cell.focus();
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });
</script>

<!-- Your existing table and styling below remains the same -->

<table>
  <thead>
    <tr>
      <th>TOUR</th>
      <th>ARBEITSTAGEN</th>
      <th>DRIVER</th>
      <th>MONTH</th>
      {#each Array(31) as _, i}
        <th>{i + 1}</th>
      {/each}
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each rows as row, rowIndex}
      <tr>
        <td>
          <input type="text" bind:value={row.TOUR} class="styled-input" data-tour="{rowIndex}" on:click={() => focusTourCell(rowIndex)} list="tour-list">
          <datalist id="tour-list">
            {#each toursAndDrivers as item}
              <option value={item.TOUR}></option>
            {/each}
          </datalist>
        </td>

        <td
          tabindex="0"
          data-arbeitstagen="{rowIndex}"
          on:click={() => focusArbeitstagenCell(rowIndex)}
          style="background-color: #f8f8f8; text-align: center; width: 40px; height: 25px; border: 1px solid #e0e0e0;"
        >
          {row.ARBEITSTAGEN}
        </td>

        <td>
          <input type="text" bind:value={row.DRIVER} class="styled-input" data-driver="{rowIndex}" on:click={() => focusDriverCell(rowIndex)} list="driver-list">
          <datalist id="driver-list">
            {#each toursAndDrivers as item}
              <option value={item.DRIVER}></option>
            {/each}
          </datalist>
        </td>

        <td
          tabindex="0"
          data-month="{rowIndex}"
          on:click={() => focusMonthCell(rowIndex)}
          style="background-color: #f8f8f8; text-align: center; width: 40px; height: 25px; border: 1px solid #e0e0e0;"
        >
          {row.MONTH}
        </td>

        {#each row.days as day, dayIndex}
          <td
            tabindex="0"
            data-cell="{rowIndex}-{dayIndex}"
            on:click={() => focusCell(rowIndex, dayIndex)}
            style="background-color: {day.color}; color: #000; text-align: center; width: 25px; height: 25px; border: 1px solid #e0e0e0;"
          >
            {day.letter}
          </td>
        {/each}

        <td>
          <button on:click={() => insertRowUnder(rowIndex)} class="action-button">+</button>
          <button on:click={() => deleteRow(rowIndex)} class="action-button">✕</button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<button on:click={addRow} class="action-button">+ Add Row</button>

<style>
  table {
    width: 100%;
    margin: 20px 0;
    background-color: #f8f8f8;
    border-spacing: 0;
    font-size: 14px;
    border-collapse: separate;
    border: none;
  }

  th, td {
    padding: 6px 8px;
    white-space: nowrap;
    border-bottom: 1px solid #e0e0e0;
  }

  th {
    font-weight: 500;
    text-transform: uppercase;
  }

  td {
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  td:focus {
    outline: 2px solid black; /* To make focused cell stand out */
  }

  .styled-input {
    width: 100%;
    border: none;
    border-radius: 4px;
    background-color: #fafafa;
    font-size: 14px;
    transition: border-color 0.2s ease;
  }

  .styled-input:focus {
    border-color: #888;
    outline: none;
  }

  button {
    padding: 4px 8px;
    background-color: transparent;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #333;
  }

  button:hover {
    color: #555;
  }

  .action-button {
    padding: 4px 8px;
    background-color: #f0f0f0;
    border: 1px solid #d0d0d0;
    border-radius: 4px;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  .action-button:hover {
    background-color: #e0e0e0;
    color: #000;
  }

  .action-button:focus {
    outline: none;
  }
</style>
