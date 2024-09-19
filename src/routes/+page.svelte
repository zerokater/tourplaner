<script>
  import { toursAndDrivers } from './data.js';
  import { db } from '$lib/firebaseConfig'; // Firebase configuration
  import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
  import { onMount } from 'svelte';

  let datarows = toursAndDrivers.map(item => ({
    TOUR: item.TOUR,
    ARBEITSTAGEN: "",  // Default empty
    DRIVER: item.DRIVER,
    MONTH: "", // Default empty
    days: Array(31).fill({ letter: "", color: "" })
  }));

  let rows = [];
  let rowIds = []; // Track Firestore document IDs

  let focusedCell = { rowIndex: null, dayIndex: null, isTour: false, isDriver: false, isMonthCell: false, isArbeitstagen: false };

  // Fetch data from Firebase Firestore on mount
  onMount(async () => {
    const querySnapshot = await getDocs(collection(db, "toursAndDrivers"));
    querySnapshot.forEach((doc) => {
      const rowData = doc.data();
      rows.push({
        TOUR: rowData.TOUR,
        ARBEITSTAGEN: rowData.ARBEITSTAGEN,
        DRIVER: rowData.DRIVER,
        MONTH: rowData.MONTH,
        days: rowData.days
      });
      rowIds.push(doc.id); // Save the document ID for updates later
    });
  });

  // Save new row data to Firestore
  async function saveRowToFirestore(row) {
    try {
      const docRef = await addDoc(collection(db, "toursAndDrivers"), row);
      rowIds.push(docRef.id); // Save the new document ID for future updates
      console.log("Document successfully written!");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  // Update existing row in Firestore
  async function updateRowInFirestore(rowId, updatedRow) {
    const rowRef = doc(db, "toursAndDrivers", rowId);
    await updateDoc(rowRef, updatedRow);
  }

  function handleInputChange(rowIndex, field, value) {
    rows[rowIndex][field] = value;
    updateRowInFirestore(rowIds[rowIndex], rows[rowIndex]); // Update Firestore with the new data
  }

  function handleDayChange(rowIndex, dayIndex, letter, color) {
    rows[rowIndex].days[dayIndex] = { letter, color };
    updateRowInFirestore(rowIds[rowIndex], rows[rowIndex]); // Update Firestore with the new data
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
    rows = rows.filter((_, i) => i !== index);
    // Optionally, remove the document from Firestore here (Firebase doesn't auto-delete)
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
</script>

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
          <input type="text" bind:value={row.TOUR} class="styled-input" data-tour="{rowIndex}" on:input={(e) => handleInputChange(rowIndex, 'TOUR', e.target.value)} list="tour-list">
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
          <input type="text" bind:value={row.ARBEITSTAGEN} class="styled-input" on:input={(e) => handleInputChange(rowIndex, 'ARBEITSTAGEN', e.target.value)}>
        </td>

        <td>
          <input type="text" bind:value={row.DRIVER} class="styled-input" data-driver="{rowIndex}" on:input={(e) => handleInputChange(rowIndex, 'DRIVER', e.target.value)} list="driver-list">
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
          <input type="text" bind:value={row.MONTH} class="styled-input" on:input={(e) => handleInputChange(rowIndex, 'MONTH', e.target.value)}>
        </td>

        {#each row.days as day, dayIndex}
          <td
            tabindex="0"
            data-cell="{rowIndex}-{dayIndex}"
            on:click={() => focusCell(rowIndex, dayIndex)}
            style="{getSaturdaySundayStyles(dayIndex, row.MONTH)} background-color: {day.color}; color: #000; text-align: center; width: 25px; height: 25px; border: 1px solid #e0e0e0;"
          >
            <input type="text" value={day.letter} on:input={(e) => handleDayChange(rowIndex, dayIndex, e.target.value, day.color)}>
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
