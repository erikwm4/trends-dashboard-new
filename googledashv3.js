document.addEventListener('DOMContentLoaded', () => {
    // DOM Element references
    const tabButtons = document.querySelectorAll('.tab-button');
    const cityTitle = document.getElementById('city-title');
    const widgetGrid = document.querySelector('.widget-grid-container');
    const saveDashboardButton = document.getElementById('save-dashboard-button');
    const loadDashboardButton = document.getElementById('load-dashboard-button');
    const loadFileInput = document.getElementById('load-file-input');
    const addWidgetButton = document.getElementById('add-widget-button');
    const addWidgetModal = document.getElementById('add-widget-modal');
    const modalCloseButton = document.querySelector('#add-widget-modal .close-button');
    const modalAddButton = document.getElementById('modal-add-button');
    const modalGeoSelect = document.getElementById('modal-geo');
    const globalDateInput = document.getElementById('global-date-range');
    const modalChartTypeSelect = document.getElementById('modal-chart-type');

    // New button for adding cities
    const addCityButton = document.getElementById('add-city-button');
    const addCityModal = document.getElementById('add-city-modal');
    const addCityCloseButton = document.querySelector('#add-city-modal .close-button');
    const newCityInput = document.getElementById('new-city-name');
    const newCityAddButton = document.getElementById('new-city-add-button');
    
    // New object for all US states
    const allUSStates = {
        'US-AL': 'Alabama', 'US-AK': 'Alaska', 'US-AZ': 'Arizona', 'US-AR': 'Arkansas',
        'US-CA': 'California', 'US-CO': 'Colorado', 'US-CT': 'Connecticut', 'US-DE': 'Delaware',
        'US-FL': 'Florida', 'US-GA': 'Georgia', 'US-HI': 'Hawaii', 'US-ID': 'Idaho',
        'US-IL': 'Illinois', 'US-IN': 'Indiana', 'US-IA': 'Iowa', 'US-KS': 'Kansas',
        'US-KY': 'Kentucky', 'US-LA': 'Louisiana', 'US-ME': 'Maine', 'US-MD': 'Maryland',
        'US-MA': 'Massachusetts', 'US-MI': 'Michigan', 'US-MN': 'Minnesota', 'US-MS': 'Mississippi',
        'US-MO': 'Missouri', 'US-MT': 'Montana', 'US-NE': 'Nebraska', 'US-NV': 'Nevada',
        'US-NH': 'New Hampshire', 'US-NJ': 'New Jersey', 'US-NM': 'New Mexico', 'US-NY': 'New York',
        'US-NC': 'North Carolina', 'US-ND': 'North Dakota', 'US-OH': 'Ohio', 'US-OK': 'Oklahoma',
        'US-OR': 'Oregon', 'US-PA': 'Pennsylvania', 'US-RI': 'Rhode Island', 'US-SC': 'South Carolina',
        'US-SD': 'South Dakota', 'US-TN': 'Tennessee', 'US-TX': 'Texas', 'US-UT': 'Utah',
        'US-VT': 'Vermont', 'US-VA': 'Virginia', 'US-WA': 'Washington', 'US-WV': 'West Virginia',
        'US-WI': 'Wisconsin', 'US-WY': 'Wyoming'
    };

    let currentCity = 'Cincinnati';
    let dashboards = {
        'Cincinnati': [],
        'StLouis': [],
        'Detroit': []
    };

    const cityData = {
        'Cincinnati': {
            title: 'Cincinnati Dashboard',
            states: { 'US-OH': 'Ohio', 'US-KY': 'Kentucky', 'US-IN': 'Indiana' },
        },
        'StLouis': {
            title: 'St. Louis Dashboard',
            states: { 'US-MO': 'Missouri', 'US-IL': 'Illinois' },
        },
        'Detroit': {
            title: 'Detroit Dashboard',
            states: { 'US-MI': 'Michigan', 'US-OH': 'Ohio' },
        }
    };

    const modalFlatpickr = flatpickr("#modal-date", {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: ["2024-01-01", "2024-12-31"]
    });

    const globalFlatpickr = flatpickr(globalDateInput, {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: ["2024-01-01", "2024-12-31"],
        onChange: function(selectedDates, dateStr) {
            if (selectedDates.length === 2) {
                updateAllWidgetsDate(dateStr);
            }
        }
    });

    // ==========================================================
    // SAVE & LOAD FUNCTIONS
    // ==========================================================

    function saveDashboard() {
        const dashboardData = {
            cityData: cityData,
            dashboards: dashboards
        };

        const dataStr = JSON.stringify(dashboardData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all-dashboards.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function loadDashboard(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const dashboardData = JSON.parse(event.target.result);

                Object.keys(dashboards).forEach(key => delete dashboards[key]);
                Object.keys(cityData).forEach(key => delete cityData[key]);
                document.querySelector('.tabs-container').innerHTML = '';

                Object.assign(cityData, dashboardData.cityData);
                Object.assign(dashboards, dashboardData.dashboards);

                Object.keys(cityData).forEach(cityKey => {
                    const newTabButton = document.createElement('button');
                    newTabButton.className = 'tab-button';
                    newTabButton.setAttribute('data-city', cityKey);
                    newTabButton.innerHTML = `<i class="fas fa-plus"></i> ${cityData[cityKey].title.replace(' Dashboard', '')}`;
                    document.querySelector('.tabs-container').appendChild(newTabButton);
                });

                currentCity = Object.keys(cityData)[0];
                const firstTab = document.querySelector(`.tab-button[data-city="${currentCity}"]`);
                if (firstTab) {
                    firstTab.classList.add('active');
                }
                
                renderCity(currentCity);

            } catch (e) {
                alert('Failed to load dashboard data. The file may be corrupted or in an incorrect format.');
                console.error('Loading error:', e);
            }
        };
        reader.readAsText(file);
    }

    // ==========================================================
    // CORE FUNCTIONS
    // ==========================================================

    function renderCity(city) {
        cityTitle.textContent = cityData[city].title;
        widgetGrid.innerHTML = '';
        updateGeoSelect(city);

        if (dashboards[city]) {
            dashboards[city].forEach(widget => {
                renderSingleWidget(widget);
            });
        }
    }

    function renderSingleWidget(widget) {
        if (!window.trends || !window.trends.embed) {
            console.error("Google Trends embed script failed to load.");
            return;
        }

        const widgetCard = document.createElement('div');
        widgetCard.className = 'widget-card';
        widgetCard.id = widget.id;
        widgetCard.innerHTML = `
            <div class="widget-card-header">
                <h3 class="widget-card-title">${widget.keyword} (${widget.geo.split('-')[1]}) - ${widget.chartType}</h3>
                <button class="remove-widget-button" data-widget-id="${widget.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <div id="embed-${widget.id}" class="trends-embed"></div>
        `;
        widgetGrid.appendChild(widgetCard);

        trends.embed.renderExploreWidgetTo(
            document.getElementById(`embed-${widget.id}`),
            widget.chartType === 'Interest over time' ? "TIMESERIES" : "GEO_MAP",
            {
                "comparisonItem": [{ "keyword": widget.keyword, "geo": widget.geo, "time": widget.dateRange }],
                "category": 0,
                "property": ""
            }
        );
    }

    function updateGeoSelect(city) {
        modalGeoSelect.innerHTML = '';
        
        let statesToDisplay = {};
        if (cityData[city] && cityData[city].states) {
            statesToDisplay = cityData[city].states;
        } else {
            statesToDisplay = allUSStates;
        }

        for (const code in statesToDisplay) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = statesToDisplay[code];
            modalGeoSelect.appendChild(option);
        }
    }

    function updateAllWidgetsDate(dateStr) {
        const trendsTime = dateStr.replace(' to ', ' ');
        dashboards[currentCity].forEach(widget => {
            widget.dateRange = trendsTime;
            reRenderWidget(widget);
        });
    }

    function addNewWidget(keyword, geo, dateRange, chartType) {
        if (!window.trends || !window.trends.embed) {
            console.error("Google Trends embed script failed to load.");
            return;
        }

        const widgetId = `widget-${Date.now()}`;
        const newWidget = {
            id: widgetId,
            keyword: keyword,
            geo: geo,
            dateRange: dateRange,
            chartType: chartType
        };
        dashboards[currentCity].push(newWidget);
        renderSingleWidget(newWidget);
    }

    function reRenderWidget(widget) {
        if (!window.trends || !window.trends.embed) {
            console.error("Google Trends embed script failed to load.");
            return;
        }

        const trendsEmbedContainer = document.getElementById(`embed-${widget.id}`);
        if (!trendsEmbedContainer) {
            console.error(`Trends embed container for widget ${widget.id} not found.`);
            return;
        }
        trendsEmbedContainer.innerHTML = '';

        trends.embed.renderExploreWidgetTo(
            trendsEmbedContainer,
            widget.chartType === 'Interest over time' ? "TIMESERIES" : "GEO_MAP",
            {
                "comparisonItem": [{ "keyword": widget.keyword, "geo": widget.geo, "time": widget.dateRange }],
                "category": 0,
                "property": ""
            }
        );
    }

    function addCity(cityName) {
        const key = cityName.replace(/\s/g, '');
        cityData[key] = {
            title: `${cityName} Dashboard`,
            states: allUSStates
        };
        dashboards[key] = [];

        const newTabButton = document.createElement('button');
        newTabButton.className = 'tab-button';
        newTabButton.setAttribute('data-city', key);
        newTabButton.innerHTML = `<i class="fas fa-plus"></i> ${cityName}`;

        newTabButton.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            newTabButton.classList.add('active');
            currentCity = key;
            renderCity(currentCity);
        });

        const tabsContainer = document.querySelector('.tabs-container');
        tabsContainer.appendChild(newTabButton);
    }

    // ==========================================================
    // EVENT LISTENERS
    // ==========================================================

    document.querySelector('.tabs-container').addEventListener('click', (event) => {
        const button = event.target.closest('.tab-button');
        if (button) {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCity = button.dataset.city;
            renderCity(currentCity);
        }
    });

    saveDashboardButton.addEventListener('click', saveDashboard);

    loadDashboardButton.addEventListener('click', () => {
        loadFileInput.click();
    });

    loadFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            loadDashboard(file);
        }
    });

    addWidgetButton.addEventListener('click', () => {
        modalFlatpickr.setDate(globalFlatpickr.selectedDates);
        document.getElementById('modal-keyword').value = "";
        addWidgetModal.classList.add('active');
    });

    modalCloseButton.addEventListener('click', () => {
        addWidgetModal.classList.remove('active');
    });

    window.addEventListener('click', (event) => {
        if (event.target === addWidgetModal) {
            addWidgetModal.classList.remove('active');
        }
    });

    modalAddButton.addEventListener('click', () => {
        const keyword = document.getElementById('modal-keyword').value.trim();
        const geo = document.getElementById('modal-geo').value;
        const dateRange = document.getElementById('modal-date').value;
        const chartType = modalChartTypeSelect.value;

        if (!keyword || !dateRange) {
            alert('Please fill out all fields.');
            return;
        }

        addNewWidget(keyword, geo, dateRange.replace(' to ', ' '), chartType);
        addWidgetModal.classList.remove('active');
    });

    widgetGrid.addEventListener('click', (event) => {
        const button = event.target.closest('.remove-widget-button');
        if (button) {
            const widgetId = button.dataset.widgetId;
            const widgetToRemove = document.getElementById(widgetId);
            if (widgetToRemove) {
                dashboards[currentCity] = dashboards[currentCity].filter(w => w.id !== widgetId);
                widgetToRemove.remove();
            }
        }
    });

    // Add City Modal Event Listeners
    addCityButton.addEventListener('click', () => {
        addCityModal.classList.add('active');
    });

    addCityCloseButton.addEventListener('click', () => {
        addCityModal.classList.remove('active');
    });

    newCityAddButton.addEventListener('click', () => {
        const newCityName = newCityInput.value.trim();
        if (newCityName) {
            addCity(newCityName);
            addCityModal.classList.remove('active');
            newCityInput.value = '';
        } else {
            alert('Please enter a city name.');
        }
    });

    // ==========================================================
    // INITIALIZATION
    // ==========================================================

    renderCity(currentCity);
});