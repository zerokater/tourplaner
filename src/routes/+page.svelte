<script>
  import { toursAndDrivers } from './data.js';

  let datarows = toursAndDrivers.map(item => ({
    TOUR: item.TOUR,
    ARBEITSTAGEN: "",  // Default empty
    DRIVER: item.DRIVER,
    MONTH: "", // Default empty
    days: Array(31).fill({ letter: "", color: "" })
  }));

  import { onMount } from 'svelte';

  let rows = [
    { TOUR: "Tour 1", ARBEITSTAGEN: "", DRIVER: "Driver A", MONTH: "9", days: Array(31).fill({ letter: "", color: "" }) },
    { TOUR: "Tour 2", ARBEITSTAGEN: "", DRIVER: "Driver B", MONTH: "9", days: Array(31).fill({ letter: "", color: "" }) },
  ];

  let focusedCell = { rowIndex: null, dayIndex: null, isTour: false, isDriver: false, isMonthCell: false, isArbeitstagen: false };

  // Function to apply styles for Saturdays and Sundays
  function getSaturdaySundayStyles(dayIndex, month) {
    const year = new Date().getFullYear(); // Use the current year
    const date = new Date(year, month - 1, dayIndex + 1); // Adjust for month (0-based) and dayIndex (1-based)
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 6) {
      // Saturday (6)
      return "background-color: #b0b0b0;"; // Darker grey for Saturday
    } else if (dayOfWeek === 0) {
      // Sunday (0)
      return "background-color: #c0c0c0;"; // Slightly lighter grey for Sunday
    }

    return "";
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

    rows = rows.map((row, i) =>
      i === rowIndex ? { ...row, days: newDays } : row
    );
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

  function handleArrowKeyNavigation(key, rowIndex, dayIndex, isTour, isDriver, isMonthCell, isArbeitstagen) {
    if (isTour) {
      switch (key) {
        case "ArrowRight":
          focusArbeitstagenCell(rowIndex); // Move to ARBEITSTAGEN when right arrow is pressed
          break;
        case "ArrowUp":
          if (rowIndex > 0) focusTourCell(rowIndex - 1); // Move to TOUR above
          break;
        case "ArrowDown":
          if (rowIndex < rows.length - 1) focusTourCell(rowIndex + 1); // Move to TOUR below
          break;
      }
    } else if (isDriver) {
      switch (key) {
        case "ArrowRight":
          focusMonthCell(rowIndex); // Move to MONTH when right arrow is pressed
          break;
        case "ArrowLeft":
          focusArbeitstagenCell(rowIndex); // Move to ARBEITSTAGEN when left arrow is pressed
          break;
        case "ArrowUp":
          if (rowIndex > 0) focusDriverCell(rowIndex - 1); // Move to DRIVER above
          break;
        case "ArrowDown":
          if (rowIndex < rows.length - 1) focusDriverCell(rowIndex + 1); // Move to DRIVER below
          break;
      }
    } else if (isMonthCell) {
      switch (key) {
        case "ArrowRight":
          focusCell(rowIndex, 0); // Move to the first day if right arrow is pressed
          break;
        case "ArrowUp":
          if (rowIndex > 0) focusMonthCell(rowIndex - 1); // Move to month above
          break;
        case "ArrowDown":
          if (rowIndex < rows.length - 1) focusMonthCell(rowIndex + 1); // Move to month below
          break;
      }
    } else if (isArbeitstagen) {
      switch (key) {
        case "ArrowRight":
          focusDriverCell(rowIndex); // Move to DRIVER column when right arrow is pressed
          break;
        case "ArrowLeft":
          focusTourCell(rowIndex); // Move to TOUR column when left arrow is pressed
          break;
        case "ArrowUp":
          if (rowIndex > 0) focusArbeitstagenCell(rowIndex - 1); // Move to ARBEITSTAGEN cell above
          break;
        case "ArrowDown":
          if (rowIndex < rows.length - 1) focusArbeitstagenCell(rowIndex + 1); // Move to ARBEITSTAGEN cell below
          break;
      }
    } else {
      switch (key) {
        case "ArrowLeft":
          if (dayIndex > 0) focusCell(rowIndex, dayIndex - 1);
          else focusMonthCell(rowIndex); // Move to MONTH cell when reaching the left of the first day
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

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

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
  }

  function deleteRow(index) {
    rows = rows.filter((_, i) => i !== index);
  }

  function addRow() {
    rows = [...rows, { TOUR: "", ARBEITSTAGEN: "", DRIVER: "", MONTH: "", days: Array(31).fill({ letter: "", color: "" }) }];
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
            style="{getSaturdaySundayStyles(dayIndex, row.MONTH)} background-color: {day.color}; color: #000; text-align: center; width: 25px; height: 25px; border: 1px solid #e0e0e0;"
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
