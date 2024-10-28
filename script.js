


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
    new Date(2024, 10, 14), // Independencia de la Raza
    new Date(2024, 11, 8),  // Inmaculada Concepción
    new Date(2024, 11, 25)  // Navidad
];

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
            totalNewHours = 2;
            if (currentHours + totalNewHours >= 48) {
                assignRegularHours(0, 1);
                assignRegularHours(0, 1, true);
            } else {
                assignRegularHours(0, 2);
            }
        } else if (cycleDay >= 2 && cycleDay <= 6) {
            totalNewHours = 8;
            if (currentHours + totalNewHours > 48) {
                assignRegularHours(0, 7);
                assignRegularHours(0, 1, true);
            } else {
                assignRegularHours(0, 8);
            }
        }
    } else if (shift === 'tarde') {
        totalNewHours = 8;  // 7 regulares + 1 nocturna
        if (currentHours + totalNewHours >= 48) {
            assignRegularHours(7, 0);
            assignRegularHours(0, 1, true); // La hora extra siempre es nocturna
        } else {
            assignRegularHours(7, 1);
        }
    } else { // mañana
        totalNewHours = 8;
        if (currentHours + totalNewHours >= 48) {  // Cambiado de > a >=
            const hoursUntil48 = 48 - currentHours;
            const regularHours = hoursUntil48;
            const extraHours = totalNewHours - hoursUntil48;

            if (isHol) {
                // Si es festivo, dividir entre horas festivas normales y extra festiva
                hours.holiday = 7;
                hours.extraHoliday = 1;
            } else if (isSun) {
                // Si es domingo, dividir entre horas dominicales normales y extra dominical
                hours.sunday = 7;
                hours.extraSunday = 1;
            } else {
                // Día normal, dividir entre horas regulares normales y extra regular
                hours.regular = 7;
                hours.extraRegular = 1;
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

// ==========================================
// CÁLCULO DE HORAS EXTRAS NOCTURNAS
// ==========================================

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
    const willReach48 = currentHours < 48 && (currentHours + 6) >= 48;

    if (willReach48) {
        // 5 horas normales + 1 extra
        if (nextIsHol) {
            extraHours.nightHoliday = 5;
            extraHours.extraNightHoliday = 1;
        } else if (nextIsSun) {
            extraHours.nightSunday = 5;
            extraHours.extraNightSunday = 1;
        } else {
            extraHours.night = 5;
            extraHours.extraNight = 1;
        }
    } else {
        // 6 horas normales
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
    const monthInput = document.getElementById('monthInput').value;
    const [year, month] = monthInput.split('-').map(Number);
    const startShift = document.getElementById('startShift').value;
    const dayOfCycle = parseInt(document.getElementById('dayOfCycle').value);

    const shifts = ['tarde', 'manana', 'noche'];
    let currentShiftIndex = shifts.indexOf(startShift);
    let currentDay = dayOfCycle - 1;
    
    const headerRow = '<tr>' +
        '<th>Fecha</th><th>Día</th><th>Turno</th><th>Día Ciclo</th>' +
        '<th>Regular</th><th>Extra Regular</th>' +
        '<th>Nocturna</th><th>Extra Nocturna</th>' +
        '<th>Dominical</th><th>Extra Dominical</th>' +
        '<th>Festiva</th><th>Extra Festiva</th>' +
        '<th>Nocturna Dominical</th><th>Extra Noct. Dom.</th>' +
        '<th>Nocturna Festiva</th><th>Extra Noct. Fest.</th>' +
        '</tr>';
    let tableHTML = '<table>' + headerRow;

    const daysInMonth = new Date(year, month, 0).getDate();
    const weekTracker = new WeeklyHoursTracker();
    let monthTotals = {
        regular: 0, night: 0,
        sunday: 0, holiday: 0,
        nightSunday: 0, nightHoliday: 0,
        extraRegular: 0, extraNight: 0,
        extraSunday: 0, extraHoliday: 0,
        extraNightSunday: 0, extraNightHoliday: 0
    };

    // Si empezamos en día de descanso, calculamos cuando empezará el próximo ciclo
    let daysToSkip = 0;
    if (dayOfCycle === 7) { // DD1
        daysToSkip = 2; // Necesita saltar 2 días para llegar al día 1
    } else if (dayOfCycle === 8) { // DD2
        daysToSkip = 1; // Necesita saltar 1 día para llegar al día 1
    }

    for (let i = 0; i < daysInMonth; i++) {
        const currentDate = new Date(year, month - 1, i + 1);
        const dayOfWeek = getDayOfWeek(currentDate);
        const shiftName = shifts[currentShiftIndex];
        const cycleDay = (currentDay % 8) + 1;
        const isWorkDay = cycleDay <= 6;

        // Si estamos saltando días por inicio en descanso
        if (daysToSkip > 0) {
            tableHTML += `<tr class="rest-day">
                <td>${currentDate.toLocaleDateString('es-ES')}</td>
                <td>${dayOfWeek}</td>
                <td>Descanso</td>
                <td>${formatCycleDay(cycleDay)}</td>
                <td colspan="12">-</td>
            </tr>`;
            daysToSkip--;
            currentDay = (currentDay + 1) % 8;
            continue;
        }

        if (cycleDay === 1) {
            weekTracker.reset(currentDate);
        }

        if (isWorkDay) {
            const isFirstDay = cycleDay === 1;
            const hours = calculateHours(currentDate, shiftName, cycleDay, isFirstDay, weekTracker);
            
            if (shiftName === 'noche' && cycleDay === 6) {
                const extraHours = calculateExtraNightHours(currentDate, weekTracker);
                Object.keys(extraHours).forEach(key => {
                    hours[key] += extraHours[key];
                });
            }

            Object.keys(hours).forEach(key => {
                monthTotals[key] += hours[key];
            });

            tableHTML += `<tr>
                <td>${currentDate.toLocaleDateString('es-ES')}</td>
                <td>${dayOfWeek}</td>
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
                <td>${dayOfWeek}</td>
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

    // Generar solo la tabla de resumen
    const summaryTableHTML = `
        <div class="summary-section">
            <h3>Resumen de Horas del Mes</h3>
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Tipo de Hora</th>
                        <th>Horas Normales</th>
                        <th>Horas Extra</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Regulares</td>
                        <td>${monthTotals.regular}</td>
                        <td>${monthTotals.extraRegular}</td>
                        <td>${monthTotals.regular + monthTotals.extraRegular}</td>
                    </tr>
                    <tr>
                        <td>Nocturnas</td>
                        <td>${monthTotals.night}</td>
                        <td>${monthTotals.extraNight}</td>
                        <td>${monthTotals.night + monthTotals.extraNight}</td>
                    </tr>
                    <tr>
                        <td>Dominicales</td>
                        <td>${monthTotals.sunday}</td>
                        <td>${monthTotals.extraSunday}</td>
                        <td>${monthTotals.sunday + monthTotals.extraSunday}</td>
                    </tr>
                    <tr>
                        <td>Festivas</td>
                        <td>${monthTotals.holiday}</td>
                        <td>${monthTotals.extraHoliday}</td>
                        <td>${monthTotals.holiday + monthTotals.extraHoliday}</td>
                    </tr>
                    <tr>
                        <td>Nocturnas Dominicales</td>
                        <td>${monthTotals.nightSunday}</td>
                        <td>${monthTotals.extraNightSunday}</td>
                        <td>${monthTotals.nightSunday + monthTotals.extraNightSunday}</td>
                    </tr>
                    <tr>
                        <td>Nocturnas Festivas</td>
                        <td>${monthTotals.nightHoliday}</td>
                        <td>${monthTotals.extraNightHoliday}</td>
                        <td>${monthTotals.nightHoliday + monthTotals.extraNightHoliday}</td>
                    </tr>
                    <tr class="total-row">
                        <td>TOTAL</td>
                        <td>${Object.values({
                            regular: monthTotals.regular,
                            night: monthTotals.night,
                            sunday: monthTotals.sunday,
                            holiday: monthTotals.holiday,
                            nightSunday: monthTotals.nightSunday,
                            nightHoliday: monthTotals.nightHoliday
                        }).reduce((a, b) => a + b, 0)}</td>
                        <td>${Object.values({
                            extraRegular: monthTotals.extraRegular,
                            extraNight: monthTotals.extraNight,
                            extraSunday: monthTotals.extraSunday,
                            extraHoliday: monthTotals.extraHoliday,
                            extraNightSunday: monthTotals.extraNightSunday,
                            extraNightHoliday: monthTotals.extraNightHoliday
                        }).reduce((a, b) => a + b, 0)}</td>
                        <td>${Object.values(monthTotals).reduce((a, b) => a + b, 0)}</td>
                    </tr>
                </tbody>
            </table>
        </div>`;

    document.getElementById('schedule').innerHTML = tableHTML;
    document.getElementById('totals').innerHTML = summaryTableHTML;
}

// Agregar event listener al formulario
document.getElementById('scheduleForm').addEventListener('submit', generateSchedule);