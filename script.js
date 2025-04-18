// función para los días de descanso
function formatCycleDay(cycleDay) {
    if (cycleDay === 7) {
        return 'DD1';
    } else if (cycleDay === 8) {
        return 'DD2';
    } else {
        return `Día ${cycleDay}`;
    }
}

// ==========================================
// CONFIGURACIÓN INICIAL Y DÍAS FESTIVOS 2024
// ==========================================
const holidays2024 = [
    new Date(2024, 0, 1),  // Año Nuevo
    new Date(2024, 0, 8),  // Reyes Magos
    new Date(2024, 2, 25), // San José
    new Date(2024, 2, 28), // Jueves Santo
    new Date(2024, 2, 29), // Viernes Santo
    new Date(2024, 3, 17), // Jueves Santo
    new Date(2024, 3, 18), // Viernes Santo
    new Date(2024, 4, 1),  // Día del Trabajo
    new Date(2024, 4, 13), // Ascensión del Señor
    new Date(2024, 5, 3),  // Corpus Christi
    new Date(2024, 5, 10), // Sagrado Corazón
    new Date(2024, 6, 1),  // San Pedro y San Pablo
    new Date(2024, 6, 20), // Independencia
    new Date(2024, 7, 7),  // Batalla de Boyacá
    new Date(2024, 7, 19), // Asunción de la Virgen
    new Date(2024, 9, 14), // Día de la Raza
    new Date(2024, 10, 4), // Todos los Santos
    new Date(2024, 10, 11), // Independencia de Cartagena
    new Date(2024, 11, 25)  // festivo 1 nov
];

// ==========================================
// VARIABLES GLOBALES Y FUNCIONES DE CALENDARIO
// ==========================================
let vacationDates = {
    start: null,
    end: null
};

// ==========================================
// FUNCIONES DE FORMATEO Y CALENDARIO
// ==========================================
function formatDate(date) {
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long'
    });
}

function createCalendar(year, month) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    let html = '<table class="calendar"><thead><tr>';
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    days.forEach(day => {
        html += `<th>${day}</th>`;
    });
    
    html += '</tr></thead><tbody>';
    
    let date = 1;
    for (let i = 0; i < 6; i++) {
        html += '<tr>';
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay.getDay()) {
                html += '<td></td>';
            } else if (date > lastDay.getDate()) {
                html += '<td></td>';
            } else {
                const currentDate = new Date(year, month - 1, date);
                const isSelected = isDateInRange(currentDate);
                html += `<td data-date="${date}" ${isSelected ? 'class="selected"' : ''}>${date}</td>`;
                date++;
            }
        }
        html += '</tr>';
        if (date > lastDay.getDate()) break;
    }
    
    html += '</tbody></table>';
    return html;
}

function initializeCalendarEvents() {
    const cells = document.querySelectorAll('.calendar td[data-date]');
    cells.forEach(cell => {
        cell.addEventListener('click', function() {
            const [year, month] = document.getElementById('monthInput').value.split('-').map(Number);
            const date = parseInt(this.dataset.date);
            const selectedDate = new Date(year, month - 1, date);

            if (!vacationDates.start || (vacationDates.start && vacationDates.end)) {
                vacationDates = {
                    start: selectedDate,
                    end: null
                };
            } else {
                if (selectedDate >= vacationDates.start) {
                    vacationDates.end = selectedDate;
                } else {
                    vacationDates.end = vacationDates.start;
                    vacationDates.start = selectedDate;
                }
            }

            document.getElementById('vacationCalendar').innerHTML = createCalendar(year, month);
            updateSelectedDatesText();
            initializeCalendarEvents();
        });
    });
}

function updateSelectedDatesText() {
    const selectedDatesElement = document.getElementById('selectedDates');
    if (!vacationDates.start) {
        selectedDatesElement.textContent = 'No hay fechas seleccionadas';
        return;
    }
    
    let text = `Desde: ${formatDate(vacationDates.start)}`;
    if (vacationDates.end) {
        text += ` hasta: ${formatDate(vacationDates.end)}`;
    }
    selectedDatesElement.textContent = text;
}

function isDateInRange(date) {
    if (!vacationDates.start) return false;
    if (!vacationDates.end) return date.getTime() === vacationDates.start.getTime();
    return date >= vacationDates.start && date <= vacationDates.end;
}

function isVacationDay(date) {
    if (!vacationDates.start || !vacationDates.end) return false;
    const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startDate = new Date(vacationDates.start.getFullYear(), vacationDates.start.getMonth(), vacationDates.start.getDate());
    const endDate = new Date(vacationDates.end.getFullYear(), vacationDates.end.getMonth(), vacationDates.end.getDate());
    return currentDate >= startDate && currentDate <= endDate;
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================
function isHoliday(date) {
    return holidays2024.some(holiday => 
        holiday.getDate() === date.getDate() && 
        holiday.getMonth() === date.getMonth()
    );
}

function isSunday(date) {
    return date.getDay() === 0;
}

function getDayOfWeek(date) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
}

function WeeklyHoursTracker() {
    this.cycleHours = 0;
    this.cycleStartDate = null;
    
    this.reset = function(date) {
        this.cycleHours = 0;
        this.cycleStartDate = new Date(date);
    }

    this.addHours = function(hours) {
        this.cycleHours += hours;
        return this.cycleHours;
    }

    this.getCurrentHours = function() {
        return this.cycleHours;
    }
}

// ==========================================
// CÁLCULO DE HORAS Y EXTRAS
// ==========================================
function calculateHours(date, shift, cycleDay, isFirstDay, weekTracker) {
    let hours = {
        regular: 0, night: 0,
        sunday: 0, holiday: 0,
        nightSunday: 0, nightHoliday: 0,
        extraRegular: 0, extraNight: 0,
        extraSunday: 0, extraHoliday: 0,
        extraNightSunday: 0, extraNightHoliday: 0
    };

    const isHol = isHoliday(date);
    const isSun = isSunday(date);
    const currentHours = weekTracker.getCurrentHours();

    function assignRegularHours(regularHours, nightHours, isExtra = false) {
        if (isHol) {
            if (isExtra) {
                hours.extraHoliday = regularHours;
                hours.extraNightHoliday = nightHours;
            } else {
                hours.holiday = regularHours;
                hours.nightHoliday = nightHours;
            }
        } else if (isSun) {
            if (isExtra) {
                hours.extraSunday = regularHours;
                hours.extraNightSunday = nightHours;
            } else {
                hours.sunday = regularHours;
                hours.nightSunday = nightHours;
            }
        } else {
            if (isExtra) {
                hours.extraRegular = regularHours;
                hours.extraNight = nightHours;
            } else {
                hours.regular = regularHours;
                hours.night = nightHours;
            }
        }
    }

    let totalNewHours;

    if (shift === 'noche') {
        if (isFirstDay || cycleDay === 1) {
            // El primer día de la jornada nocturna después del descanso es de 2 horas
            totalNewHours = 2;
            if (currentHours >= 46) {
                assignRegularHours(0, 2, true);
            } else if (currentHours + totalNewHours > 46) {
                const regularHours = 46 - currentHours;
                assignRegularHours(0, regularHours);
                assignRegularHours(0, totalNewHours - regularHours, true);
            } else {
                assignRegularHours(0, 2);
            }
        } else if (cycleDay >= 2 && cycleDay <= 6) {
            // Días normales de jornada nocturna (8 horas)
            totalNewHours = 8;
            if (currentHours >= 46) {
                assignRegularHours(0, 8, true);
            } else if (currentHours + totalNewHours > 46) {
                const regularHours = 46 - currentHours;
                assignRegularHours(0, regularHours);
                assignRegularHours(0, totalNewHours - regularHours, true);
            } else {
                assignRegularHours(0, 8);
            }
        }
    } else if (shift === 'tarde') {
        // Jornada de la tarde (7 horas diurnas + 1 hora nocturna)
        totalNewHours = 8;
        if (currentHours >= 46) {
            assignRegularHours(7, 1, true);
        } else if (currentHours + totalNewHours > 46) {
            const regularHours = 46 - currentHours;
            const extraHours = totalNewHours - regularHours;
            if (regularHours >= 7) {
                assignRegularHours(7, 0);
                assignRegularHours(0, 1, true);
            } else {
                assignRegularHours(regularHours, 0);
                assignRegularHours(7 - regularHours, 1, true);
            }
        } else {
            assignRegularHours(7, 1);
        }
    } else { // jornada de la mañana
        totalNewHours = 8;
        if (currentHours >= 46) {
            if (isHol) {
                hours.extraHoliday = 8;
            } else if (isSun) {
                hours.extraSunday = 8;
            } else {
                hours.extraRegular = 8;
            }
        } else if (currentHours + totalNewHours > 46) {
            const regularHours = 46 - currentHours;
            const extraHours = totalNewHours - regularHours;
            if (isHol) {
                hours.holiday = regularHours;
                hours.extraHoliday = extraHours;
            } else if (isSun) {
                hours.sunday = regularHours;
                hours.extraSunday = extraHours;
            } else {
                hours.regular = regularHours;
                hours.extraRegular = extraHours;
            }
        } else {
            if (isHol) {
                hours.holiday = 8;
            } else if (isSun) {
                hours.sunday = 8;
            } else {
                hours.regular = 8;
            }
        }
    }

    weekTracker.addHours(totalNewHours);
    return hours;
}



function calculateExtraNightHours(date, weekTracker) {
    let extraHours = {
        regular: 0, night: 0,
        sunday: 0, holiday: 0,
        nightSunday: 0, nightHoliday: 0,
        extraRegular: 0, extraNight: 0,
        extraSunday: 0, extraHoliday: 0,
        extraNightSunday: 0, extraNightHoliday: 0
    };

    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    const nextIsHol = isHoliday(nextDay);
    const nextIsSun = isSunday(nextDay);
    
    const currentHours = weekTracker.getCurrentHours();
    const willReach46 = currentHours < 46 && (currentHours + 6) >= 46;
    
    if (currentHours >= 46) {
        if (nextIsHol) {
            extraHours.extraNightHoliday = 6;
        } else if (nextIsSun) {
            extraHours.extraNightSunday = 6;
        } else {
            extraHours.extraNight = 6;
        }
    } else if (willReach46) {
        const regularHours = 46 - currentHours;
        const extraHoursCount = 6 - regularHours;
        
        if (nextIsHol) {
            extraHours.nightHoliday = regularHours;
            extraHours.extraNightHoliday = extraHoursCount;
        } else if (nextIsSun) {
            extraHours.nightSunday = regularHours;
            extraHours.extraNightSunday = extraHoursCount;
        } else {
            extraHours.night = regularHours;
            extraHours.extraNight = extraHoursCount;
        }
    } else {
        if (nextIsHol) {
            extraHours.nightHoliday = 6;
        } else if (nextIsSun) {
            extraHours.nightSunday = 6;
        } else {
            extraHours.night = 6;
        }
    }

    return extraHours;
}

// ==========================================
// GENERACIÓN DE HORARIO
// ==========================================
function generateSchedule(event) {
    event.preventDefault();
    
    document.getElementById('vacationModal').style.display = 'block';
    document.getElementById('vacationQuestion').style.display = 'block';
    document.getElementById('vacationSelector').style.display = 'none';
    
    const formData = {
        monthInput: document.getElementById('monthInput').value,
        startShift: document.getElementById('startShift').value,
        dayOfCycle: parseInt(document.getElementById('dayOfCycle').value)
    };
    
    document.getElementById('noVacation').onclick = function() {
        vacationDates = { start: null, end: null };
        document.getElementById('vacationModal').style.display = 'none';
        generateScheduleTable(formData);
    };

    document.getElementById('yesVacation').onclick = function() {
        const [year, month] = formData.monthInput.split('-').map(Number);
        document.getElementById('vacationQuestion').style.display = 'none';
        document.getElementById('vacationSelector').style.display = 'block';
        document.getElementById('vacationCalendar').innerHTML = createCalendar(year, month);
        initializeCalendarEvents();
    };

    document.getElementById('confirmVacation').onclick = function() {
        if (!vacationDates.start || !vacationDates.end) {
            alert('Por favor, seleccione un rango completo de fechas');
            return;
        }
        document.getElementById('vacationModal').style.display = 'none';
        generateScheduleTable(formData);
    };
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('vacationModal').style.display = 'none';
    });

    document.getElementById('cancelVacation').addEventListener('click', function() {
        vacationDates = { start: null, end: null };
        document.getElementById('vacationModal').style.display = 'none';
    });

    window.onclick = function(event) {
        const modal = document.getElementById('vacationModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});

document.getElementById('scheduleForm').addEventListener('submit', generateSchedule);

function getDateRanges(dateHoursObj) {
    if (Object.keys(dateHoursObj).length === 0) return 'No hay registros';
    
    const dates = Object.keys(dateHoursObj).map(dateStr => ({
        date: new Date(dateStr.split('/').reverse().join('/')),
        dateStr: dateStr,
        hours: dateHoursObj[dateStr].hours
    }));
    
    dates.sort((a, b) => a.date - b.date);
    let ranges = [];
    let rangeStart = dates[0];
    let rangeEnd = dates[0];
    let currentHours = dates[0].hours;
    
    for (let i = 1; i <= dates.length; i++) {
        const tomorrow = new Date(rangeEnd.date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (i < dates.length && 
            dates[i].date.getTime() === tomorrow.getTime() && 
            dates[i].hours === currentHours) {
            rangeEnd = dates[i];
        } else {
            if (rangeStart.date.getTime() === rangeEnd.date.getTime()) {
                ranges.push(`${formatDate(rangeStart.date)} (${rangeStart.hours} horas)`);
            } else {
                ranges.push(`${formatDate(rangeStart.date)} al ${formatDate(rangeEnd.date)} (${currentHours} horas por día)`);
            }
            if (i < dates.length) {
                rangeStart = dates[i];
                rangeEnd = dates[i];
                currentHours = dates[i].hours;
            }
        }
    }
    
    return ranges.join(', ');
}

function getWorkingVacationDays(startDate, endDate) {
    let workDays = 0;
    let workingDates = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        // Si no es sábado (6), domingo (0) ni festivo
        if (currentDate.getDay() !== 6 && 
            currentDate.getDay() !== 0 && 
            !isHoliday(currentDate)) {
            workDays++;
            workingDates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Formatear las fechas para el detalle
    const formattedDates = workingDates.map(date => {
        return {
            date: formatDate(date),
            dayOfWeek: getDayOfWeek(date)
        };
    });
    
    return {
        totalDays: workDays,
        dates: formattedDates
    };
}

function generateScheduleTable(formData) {
    const [year, month] = formData.monthInput.split('-').map(Number);
    const startShift = formData.startShift;
    const dayOfCycle = formData.dayOfCycle;

    const shifts = ['tarde', 'manana', 'noche'];
    let currentShiftIndex = shifts.indexOf(startShift);
    let currentDay = dayOfCycle - 1;
    
    const headerRow = '<tr>' +
        '<th>Fecha</th>' +
        '<th>Día</th>' +
        '<th>Turno</th>' +
        '<th>Día Ciclo</th>' +
        '<th>Diurna</th>' +
        '<th>Extra Diurna</th>' +
        '<th>Nocturna</th>' +
        '<th>Extra Nocturna</th>' +
        '<th>Dominical Ocasional Con Compensatorio</th>' +
        '<th>Extra Diurna Dominical</th>' +
        '<th>Festiva</th>' +
        '<th>Extra Diurna Festiva</th>' +
        '<th>Nocturna Dominical</th>' +
        '<th>Extra Noct. Dom.</th>' +
        '<th>Nocturna Festiva</th>' +
        '<th>Extra Noct. Fest.</th>' +
        '</tr>';
    let tableHTML = '<table>' + headerRow;

    const daysInMonth = new Date(year, month, 0).getDate();
    let weekTracker = new WeeklyHoursTracker();
    let monthTotals = {
        regular: 0, night: 0,
        sunday: 0, holiday: 0,
        nightSunday: 0, nightHoliday: 0,
        extraRegular: 0, extraNight: 0,
        extraSunday: 0, extraHoliday: 0,
        extraNightSunday: 0, extraNightHoliday: 0
    };

    let dateTracks = {
        night: {}, sunday: {}, holiday: {}, nightSunday: {}, nightHoliday: {},
        extraRegular: {}, extraNight: {}, extraSunday: {}, extraHoliday: {},
        extraNightSunday: {}, extraNightHoliday: {}
    };

    // Si empezamos en día de descanso, calculamos cuando empezará el próximo ciclo
let daysToSkip = 0;
if (dayOfCycle === 7) { // DD1
    daysToSkip = 2; // Necesita saltar 2 días para llegar al día 1
    currentDay = 6; // Empezaremos en el último día del ciclo anterior
} else if (dayOfCycle === 8) { // DD2
    daysToSkip = 1; // Necesita saltar 1 día para llegar al día 1
    currentDay = 7; // Empezaremos en DD1
}

    for (let i = 0; i < daysInMonth; i++) {
        const currentDate = new Date(year, month - 1, i + 1);
        const dayOfWeek = getDayOfWeek(currentDate);
        let shiftName = shifts[currentShiftIndex];
        const cycleDay = (currentDay % 8) + 1;
        const isWorkDay = cycleDay <= 6;
        const isHol = isHoliday(currentDate);
        const isVacation = isVacationDay(currentDate);

        const previousDate = new Date(currentDate);
        previousDate.setDate(previousDate.getDate() - 1);
        const wasVacation = i > 0 && isVacationDay(previousDate);
        const wasRestDay = i > 0 && ((currentDay - 1) % 8) >= 6;

        const isFirstWorkDayAfterBreak = cycleDay === 1 || wasVacation || wasRestDay;

        let rowClass = '';
        if (isVacation) {
            rowClass = 'vacation-day';
        } else if (!isWorkDay && isHol) {
            rowClass = 'holiday-rest';
        } else if (!isWorkDay) {
            rowClass = 'rest-day';
        } else if (isHol) {
            rowClass = 'holiday-row';
        }

        if (isVacation) {
            tableHTML += `<tr class="${rowClass}">
                <td>${currentDate.toLocaleDateString('es-ES')}</td>
                <td>${dayOfWeek}${isHol ? ' (Festivo)' : ''}</td>
                <td>Vacaciones</td>
                <td>${formatCycleDay(cycleDay)}</td>
                <td colspan="12">Vacaciones</td>
            </tr>`;
            
            if (cycleDay === 6) {
                currentShiftIndex = (currentShiftIndex + 1) % 3;
            }
            currentDay = (currentDay + 1) % 8;
            continue;
        }

        if (daysToSkip > 0) {
            tableHTML += `<tr class="rest-day">
                <td>${currentDate.toLocaleDateString('es-ES')}</td>
                <td>${dayOfWeek}${isHol ? ' (Festivo)' : ''}</td>
                <td>Descanso</td>
                <td>${formatCycleDay(cycleDay)}</td>
                <td colspan="12">-</td>
            </tr>`;
            
            if (cycleDay === 6) {
                currentShiftIndex = (currentShiftIndex + 1) % 3;
            }
            daysToSkip--;
            currentDay = (currentDay + 1) % 8;
            continue;
        }

        if (cycleDay === 1) {
            weekTracker.reset(currentDate);
        }

        if (isFirstWorkDayAfterBreak && isWorkDay) {
            if (wasVacation || wasRestDay) {
                currentShiftIndex = (currentShiftIndex + 1) % 3;
                shiftName = shifts[currentShiftIndex];
                
                // Resetear las horas al retomar después de las vacaciones
                if (shiftName === 'manana') {
                    weekTracker.reset(currentDate);
                }
            }
        }

        if (isWorkDay) {
            const hours = calculateHours(currentDate, shiftName, cycleDay, isFirstWorkDayAfterBreak, weekTracker);
            
            if (shiftName === 'noche' && cycleDay === 6) {
                const extraHours = calculateExtraNightHours(currentDate, weekTracker);
                Object.keys(extraHours).forEach(key => {
                    hours[key] += extraHours[key];
                });
            }

            Object.keys(hours).forEach(key => {
                if (key !== 'regular' && hours[key] > 0) {
                    const dateStr = currentDate.toLocaleDateString('es-ES');
                    if (!dateTracks[key][dateStr]) {
                        dateTracks[key][dateStr] = {
                            hours: hours[key],
                            shift: shiftName
                        };
                    } else {
                        dateTracks[key][dateStr].hours += hours[key];
                    }
                }
            });

            Object.keys(hours).forEach(key => {
                monthTotals[key] += hours[key];
            });

            tableHTML += `<tr class="${rowClass}">
                <td>${currentDate.toLocaleDateString('es-ES')}</td>
                <td>${dayOfWeek}${isHol ? ' (Festivo)' : ''}</td>
                <td>${shiftName}</td>
                <td>${formatCycleDay(cycleDay)}</td>
                <td>${hours.regular}</td>
                <td>${hours.extraRegular}</td>
                <td>${hours.night}</td>
                <td>${hours.extraNight}</td>
                <td>${hours.sunday}</td>
                <td>${hours.extraSunday}</td>
                <td>${hours.holiday}</td>
                <td>${hours.extraHoliday}</td>
                <td>${hours.nightSunday}</td>
                <td>${hours.extraNightSunday}</td>
                <td>${hours.nightHoliday}</td>
                <td>${hours.extraNightHoliday}</td>
            </tr>`;

            if (cycleDay === 6) {
                currentShiftIndex = (currentShiftIndex + 1) % 3;
            }
        } else {
            tableHTML += `<tr class="rest-day">
                <td>${currentDate.toLocaleDateString('es-ES')}</td>
                <td>${dayOfWeek}${isHol ? ' (Festivo)' : ''}</td>
                <td>Descanso</td>
                <td>${formatCycleDay(cycleDay)}</td>
                <td colspan="12">-</td>
            </tr>`;
        }

        currentDay = (currentDay + 1) % 8;
    }

    tableHTML += headerRow;
    tableHTML += `<tr class="total-row">
        <td colspan="4">TOTAL HORAS</td>
        <td>${monthTotals.regular}</td>
        <td>${monthTotals.extraRegular}</td>
        <td>${monthTotals.night}</td>
        <td>${monthTotals.extraNight}</td>
        <td>${monthTotals.sunday}</td>
        <td>${monthTotals.extraSunday}</td>
        <td>${monthTotals.holiday}</td>
        <td>${monthTotals.extraHoliday}</td>
        <td>${monthTotals.nightSunday}</td>
        <td>${monthTotals.extraNightSunday}</td>
        <td>${monthTotals.nightHoliday}</td>
        <td>${monthTotals.extraNightHoliday}</td>
    </tr>`;

    tableHTML += '</table>';
    document.getElementById('schedule').innerHTML = tableHTML;

    const totalHours = Object.values(monthTotals).reduce((a, b) => a + b, 0);
    const totalDays = Math.floor(totalHours / 8);
    const remainingHours = totalHours % 8;

    const totalsHTML = `
    <div class="month-details">
        <h3>Totales del Mes</h3>
        ${vacationDates.start ? (() => {
            const vacationInfo = getWorkingVacationDays(vacationDates.start, vacationDates.end);
            return `
            <div class="vacation-period">
                <div class="vacation-header">
                    <strong>Período de Vacaciones:</strong> ${formatDate(vacationDates.start)} al ${formatDate(vacationDates.end)}
                </div>
                <div class="vacation-details">
                    <span class="vacation-total">Días hábiles: ${vacationInfo.totalDays}</span>
                    <div class="vacation-days-list">
                        ${vacationInfo.dates.map(d => 
                            `<div class="vacation-day-item">${d.dayOfWeek} ${d.date}</div>`
                        ).join('')}
                    </div>
                </div>
            </div>
            `;
        })() : ''}
        
        <div class="hours-section">
            <h4>Horas Diurnas Ordinarias</h4>
            Total: ${monthTotals.regular} horas<br>
            <div class="extra-hours">
                Extras: ${monthTotals.extraRegular} horas<br>
                <small class="date-range">Fechas Extras: ${getDateRanges(dateTracks.extraRegular)}</small>
            </div>
        </div>

        <div class="hours-section">
            <h4>Recargo Nocturno</h4>
            Total: ${monthTotals.night} horas<br>
            <small class="date-range">Fechas: ${getDateRanges(dateTracks.night)}</small>
            <div class="extra-hours">
                Extras: ${monthTotals.extraNight} horas<br>
                <small class="date-range">Fechas Extras: ${getDateRanges(dateTracks.extraNight)}</small>
            </div>
        </div>

        <div class="hours-section">
            <h4>Horas Dominicales Ocasional Con Compensatorio</h4>
            Total: ${monthTotals.sunday} horas<br>
            <small class="date-range">Fechas: ${getDateRanges(dateTracks.sunday)}</small>
            <div class="extra-hours">
                Extras: ${monthTotals.extraSunday} horas<br>
                <small class="date-range">Fechas Extras: ${getDateRanges(dateTracks.extraSunday)}</small>
            </div>
        </div>

        <div class="hours-section">
            <h4>Horas Festivas</h4>
            Total: ${monthTotals.holiday} horas<br>
            <small class="date-range">Fechas: ${getDateRanges(dateTracks.holiday)}</small>
            <div class="extra-hours">
                Extras: ${monthTotals.extraHoliday} horas<br>
                <small class="date-range">Fechas Extras: ${getDateRanges(dateTracks.extraHoliday)}</small>
            </div>
        </div>

        <div class="hours-section">
            <h4>Horas Nocturnas Dominicales</h4>
            Total: ${monthTotals.nightSunday} horas<br>
            <small class="date-range">Fechas: ${getDateRanges(dateTracks.nightSunday)}</small>
            <div class="extra-hours">
                Extras: ${monthTotals.extraNightSunday} horas<br>
                <small class="date-range">Fechas Extras: ${getDateRanges(dateTracks.extraNightSunday)}</small>
            </div>
        </div>

        <div class="hours-section">
            <h4>Horas Nocturnas Festivas</h4>
            Total: ${monthTotals.nightHoliday} horas<br>
            <small class="date-range">Fechas: ${getDateRanges(dateTracks.nightHoliday)}</small>
            <div class="extra-hours">
                Extras: ${monthTotals.extraNightHoliday} horas<br>
                <small class="date-range">Fechas Extras: ${getDateRanges(dateTracks.extraNightHoliday)}</small>
            </div>
        </div>

        <div class="total-section">
            <h4>Total General</h4>
            ${totalDays} días${remainingHours > 0 ? ` y ${remainingHours} horas` : ''} (${totalHours} horas totales)
        </div>
    </div>`;

    document.getElementById('totals').innerHTML = totalsHTML;
}
