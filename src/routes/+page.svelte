<script>
  import { toursAndDrivers } from './data.js';

  // Initialize rows with data (will be fetched from the server)
  let rows = [];

  let focusedCell = { rowIndex: null, dayIndex: null, isTour: false, isDriver: false, isMonthCell: false, isArbeitstagen: false };

  // Add event listener for keydown events when the component mounts
  import { onMount, onDestroy } from 'svelte';

  onMount(() => {
    // Fetch data from the server on mount
    fetchData();

    // Add the event listener for keydown events
    window.addEventListener('keydown', handleKeydown);

    // Cleanup the event listener when the component is destroyed
    onDestroy(() => {
      window.removeEventListener('keydown', handleKeydown);
    });
  });

  // Fetch data from the server
  async function fetchData() {
    try {
      const response = await fetch('/api/tours');
      if (response.ok) {
        rows = await response.json(); // Load data from the server
      } else {
        console.error('Failed to load data from the server');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  // Save data to the server
  async function saveData() {
    try {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rows),
      });
      if (!response.ok) {
        console.error('Failed to save data to the server');
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Function to handle keydown events
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

      // After handling any changes, save the data
      saveData();
    }
  }

  // Handle key presses for ARBEITSTAGEN column
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

  // Handle key presses for day cells
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

  // Handle key presses for MONTH column
  function handleMonthKeydown(key, rowIndex) {
    if (key >= "1" && key <= "9") {
      rows[rowIndex].MONTH = key;
    } else if (key === "0") {
      rows[rowIndex].MONTH = "10";
    } else if (key.toUpperCase() === "N") {
      rows[rowIndex].MONTH = "11";
    } else if (key.toUpperCase() === "D") {
      rows[rowIndex].MONTH = "12";
    }
  }

  // Handle arrow key navigation between cells
  function handleArrowKeyNavigation(key, rowIndex, dayIndex, isTour, isDriver, isMonthCell, isArbeitstagen) {
    if (isTour) {
      switch (key) {
        case "ArrowRight":
          focusArbeitstagenCell(rowIndex);
          break;
        case "ArrowUp":
          if (rowIndex > 0) focusTourCell(rowIndex - 1);
          break;
        case "ArrowDown":
          if (rowIndex < rows.length - 1) focusTourCell(rowIndex + 1);
          break;
      }
    } else if (isDriver) {
      switch (key) {
        case "ArrowRight":
          focusMonthCell(rowIndex);
          break;
        case "ArrowLeft":
          focusArbeitstagenCell(rowIndex);
          break;
        case "ArrowUp":
          if (rowIndex > 0) focusDriverCell(rowIndex - 1);
          break;
        case "ArrowDown":
          if (rowIndex < rows.length - 1) focusDriverCell(rowIndex + 1);
          break;
      }
    } else if (isMonthCell) {
      switch (key) {
        case "ArrowRight":
          focusCell(rowIndex, 0); // Move to the first day if right arrow is pressed
          break;
        case "ArrowUp":
          if (rowIndex > 0) focusMonthCell(rowIndex - 1);
          break;
        case "ArrowDown":
          if (rowIndex < rows.length - 1) focusMonthCell(rowIndex + 1);
          break;
      }
    } else if (isArbeitstagen) {
      switch (key) {
        case "ArrowRight":
          focusDriverCell(rowIndex);
          break;
        case "ArrowLeft":
          focusTourCell(rowIndex);
          break;
        case "ArrowUp":
          if (rowIndex > 0) focusArbeitstagenCell(rowIndex - 1);
          break;
        case "ArrowDown":
          if (rowIndex < rows.length - 1) focusArbeitstagenCell(rowIndex + 1);
          break;
      }
    } else {
      switch (key) {
        case "ArrowLeft":
          if (dayIndex > 0) focusCell(rowIndex, dayIndex - 1);
          else focusMonthCell(rowIndex);
          break;
        case "ArrowRight":
          if (dayIndex < 30) focusCell(rowIndex, dayIndex + 1);
          break;
        case "ArrowUp":
          if (rowIndex > 0) focusCell(rowIndex - 1, dayIndex);
          break;
        case "ArrowDown":
          if (rowIndex < rows.length - 1) focusCell(rowIndex + 1, dayIndex);
          break;
      }
    }
  }

  // Functions to manage cell focus
  function focusCell(rowIndex, dayIndex) {
    focusedCell = { rowIndex, dayIndex, isTour: false, isDriver: false, isMonthCell: false, isArbeitstagen: false };
  }

  function focusArbeitstagenCell(rowIndex) {
    focusedCell = { rowIndex, dayIndex: null, isTour: false, isDriver: false, isMonthCell: false, isArbeitstagen: true };
  }

  function focusMonthCell(rowIndex) {
    focusedCell = { rowIndex, dayIndex: null, isTour: false, isDriver: false, isMonthCell: true, isArbeitstagen: false };
  }

  function focusTourCell(rowIndex) {
    focusedCell = { rowIndex, dayIndex: null, isTour: true, isDriver: false, isMonthCell: false, isArbeitstagen: false };
  }

  function focusDriverCell(rowIndex) {
    focusedCell = { rowIndex, dayIndex: null, isTour: false, isDriver: true, isMonthCell: false, isArbeitstagen: false };
  }

  // Add a new row
  function addRow() {
    rows = [...rows, { TOUR: "", ARBEITSTAGEN: "", DRIVER: "", MONTH: "", days: Array(31).fill({ letter: "", color: "" }) }];
    saveData(); // Save after adding a new row
  }

  // Delete a row
  function deleteRow(index) {
    rows = rows.filter((_, i) => i !== index);
    saveData(); // Save after deleting a row
  }

  // Insert row under and save
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
    saveData(); // Save after inserting a row
  }
</script>

<!-- Table Structure -->
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
          <input type="text" bind:value={row.TOUR} class="styled-input" data-tour="{rowIndex}" list="tour-list">
          <datalist id="tour-list">
            {#each toursAndDrivers as item}
              <option value={item.TOUR}></option>
            {/each}
          </datalist>
        </td>

        <td
          tabindex="0"
          on:click={() => focusArbeitstagenCell(rowIndex)}
          style="background-color: #f8f8f8; text-align: center; width: 40px; height: 25px; border: 1px solid #e0e0e0;"
        >
          {row.ARBEITSTAGEN}
        </td>

        <td>
          <input type="text" bind:value={row.DRIVER} class="styled-input" data-driver="{rowIndex}" list="driver-list">
          <datalist id="driver-list">
            {#each toursAndDrivers as item}
              <option value={item.DRIVER}></option>
            {/each}
          </datalist>
        </td>

        <td
          tabindex="0"
          on:click={() => focusMonthCell(rowIndex)}
          style="background-color: #f8f8f8; text-align: center; width: 40px; height: 25px; border: 1px solid #e0e0e0;"
        >
          {row.MONTH}
        </td>

        {#each row.days as day, dayIndex}
          <td
            tabindex="0"
            on:click={() => focusCell(rowIndex, dayIndex)}
            style="background-color: {day.color}; text-align: center; width: 25px; height: 25px; border: 1px solid #e0e0e0;"
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

<!-- Styles -->
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
