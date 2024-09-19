<script>
  import { db } from '$lib/firebaseConfig'; // Firebase configuration
  import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
  import { onMount } from 'svelte';
  import { toursAndDrivers } from './data.js'; // Importing your data.js for the Tour and Driver fields

  let rows = []; // This will be populated with Firestore data.
  let isLoading = true; // Track loading state for better UX

  let focusedCell = { rowIndex: null, dayIndex: null, isTour: false, isDriver: false, isMonthCell: false, isArbeitstagen: false };

  // Fetch data from Firebase Firestore on mount, ordered by 'order' field
  onMount(async () => {
    try {
      const q = query(collection(db, "toursAndDrivers"), orderBy("order", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedRows = [];
      querySnapshot.forEach((doc) => {
        const rowData = doc.data();
        fetchedRows.push({
          id: doc.id,
          TOUR: rowData.TOUR,
          ARBEITSTAGEN: rowData.ARBEITSTAGEN,
          DRIVER: rowData.DRIVER,
          MONTH: rowData.MONTH,
          days: rowData.days,
          order: rowData.order // Order field for maintaining row order
        });
      });
      rows = [...fetchedRows]; // Reassign rows to trigger reactivity
      isLoading = false; // Disable loading state after data is loaded
    } catch (e) {
      console.error("Error fetching data: ", e);
      isLoading = false; // Disable loading state if error occurs
    }
  });

  // Count the occurrences of a specific letter (A, X, S, F, K) in a row's days array
  function countOccurrences(row, letter) {
    return row.days.filter(day => day.letter === letter).length;
  }

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
      case "DEL":
        newDays[dayIndex] = { letter: "", color: "" };
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
      order: rows.length // Set the new row at the last position
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
    const newRow = {
      TOUR: "",
      ARBEITSTAGEN: "",
      DRIVER: "",
      MONTH: "",
      days: Array(31).fill({ letter: "", color: "" }),
      order: rows.length // Assign order based on current length
    };
    rows = [...rows, newRow];
    saveRowToFirestore(newRow); // Save new row to Firestore
  }

  // This will save the 'Tour' value when it's changed
  function updateTour(rowIndex, event) {
    rows[rowIndex].TOUR = event.target.value;
    updateRowInFirestore(rows[rowIndex].id, rows[rowIndex]); // Save changes to Firestore
  }

  // This will save the 'Driver' value when it's changed
  function updateDriver(rowIndex, event) {
    rows[rowIndex].DRIVER = event.target.value;
    updateRowInFirestore(rows[rowIndex].id, rows[rowIndex]); // Save changes to Firestore
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

  // Darker color for Saturdays and Sundays
  function getSaturdaySundayStyles(dayIndex, month) {
    const year = new Date().getFullYear();
    const date = new Date(year, month - 1, dayIndex + 1);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 6) {
      return "background-color: #b0b0b0;";
    } else if (dayOfWeek === 0) {
      return "background-color: #c0c0c0;";
    }
    return "";
  }
</script>

<head><title>Tourenplaner</title></head>

<!-- Table HTML -->
{#if isLoading}
  <p>Loading...</p>
{:else}
  <table>
    <thead>
      <tr>
        <th>TOUR</th>
        <th>ARBEITSTAGEN</th>
        <th>FAHRER</th>
        <th>MONAT</th>
        {#each Array(31) as _, i}
          <th>{i + 1}</th>
        {/each}
        <th style="background-color: #add8e6;">A</th>
        <th style="background-color: #ff6347;">X</th>
        <th style="background-color: #ffa500;">S</th>
        <th style="background-color: #90ee90;">F</th>
        <th style="background-color: #9370db;">K</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row, rowIndex}
        <tr>
          <td>
            <input type="text" bind:value={row.TOUR} class="styled-input" data-tour="{rowIndex}" 
            on:input={(e) => updateTour(rowIndex, e)} list="tour-list">
            <datalist id="tour-list">
              {#each toursAndDrivers as item} <!-- Getting Tour values from data.js -->
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
            <input type="text" bind:value={row.DRIVER} class="styled-input" data-driver="{rowIndex}" 
            on:input={(e) => updateDriver(rowIndex, e)} list="driver-list">
            <datalist id="driver-list">
              {#each toursAndDrivers as item} <!-- Getting Driver values from data.js -->
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
              style="{getSaturdaySundayStyles(dayIndex, row.MONTH)} background-color: {day.color}; color: #000; text-align: center; width: 25px; height: 25px; border: 1px solid #e0e0e0;"
            >
              {day.letter}
            </td>
          {/each}

          <!-- New columns for A, X, S, F, K counts -->
          <td>{countOccurrences(row, 'A')}</td>
          <td>{countOccurrences(row, 'X')}</td>
          <td>{countOccurrences(row, 'S')}</td>
          <td>{countOccurrences(row, 'F')}</td>
          <td>{countOccurrences(row, 'K')}</td>

          <td>
            <button style="background-color: deepskyblue; color:white;" on:click={() => insertRowUnder(rowIndex)} class="action-button">+</button>
            <button style="background-color: red; color:white;" on:click={() => deleteRow(rowIndex)} class="action-button">✕</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<button on:click={addRow} class="action-button" style="background-color: deepskyblue; color:white; padding:10px 20px;">+ Zeile hinzufügen</button>

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
