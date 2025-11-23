/**
 * مكتبة الرسوم البيانية
 * باستخدام Chart.js
 */

let departmentChart = null;
let performanceChart = null;
let workforceChart = null;
let growthChart = null;

// رسم توزيع الموظفين حسب الإدارات
function createDepartmentChart(data) {
    const ctx = document.getElementById('departmentChart');
    if (!ctx) return;

    // حذف الرسم القديم إن وجد
    if (departmentChart) {
        departmentChart.destroy();
    }

    const labels = data.map(d => d.name || d.department);
    const values = data.map(d => d.count || d.employee_count);
    const colors = [
        '#3B6FC9', '#4A89DC', '#5C9FE5', '#6EAFF0', '#80BFFA',
        '#92CFFF', '#A4DFFF', '#B6EFFF', '#C8F5FF', '#DAFFFF'
    ];

    departmentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, values.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    rtl: true,
                    labels: {
                        font: {
                            family: 'Tajawal',
                            size: 12
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    rtl: true,
                    titleFont: {
                        family: 'Tajawal'
                    },
                    bodyFont: {
                        family: 'Tajawal'
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} موظف (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// رسم معدل الأداء السنوي
function createPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    if (performanceChart) {
        performanceChart.destroy();
    }

    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'معدل الأداء',
                data: [4.2, 4.3, 4.1, 4.4, 4.5, 4.3, 4.6, 4.4, 4.5, 4.6, 4.7, 4.8],
                borderColor: '#3B6FC9',
                backgroundColor: 'rgba(59, 111, 201, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#3B6FC9',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    rtl: true,
                    titleFont: { family: 'Tajawal' },
                    bodyFont: { family: 'Tajawal' },
                    callbacks: {
                        label: function(context) {
                            return `التقييم: ${context.parsed.y} من 5`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        font: { family: 'Tajawal' },
                        callback: function(value) {
                            return value.toFixed(1);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: { family: 'Tajawal' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// رسم توزيع القوى العاملة
function createWorkforceChart(data) {
    const ctx = document.getElementById('workforceChart');
    if (!ctx) return;

    if (workforceChart) {
        workforceChart.destroy();
    }

    const labels = data.map(d => d.name);
    const values = data.map(d => d.employee_count);

    workforceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد الموظفين',
                data: values,
                backgroundColor: '#3B6FC9',
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    rtl: true,
                    titleFont: { family: 'Tajawal' },
                    bodyFont: { family: 'Tajawal' },
                    callbacks: {
                        label: function(context) {
                            return `الموظفون: ${context.parsed.x}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        font: { family: 'Tajawal' }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    ticks: {
                        font: { family: 'Tajawal' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// رسم توقعات النمو
function createGrowthChart() {
    const ctx = document.getElementById('growthChart');
    if (!ctx) return;

    if (growthChart) {
        growthChart.destroy();
    }

    const years = ['2024', '2025', '2026', '2027', '2028'];

    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'العدد الحالي',
                    data: [3000, 3200, 3500, 3800, 4000],
                    borderColor: '#3B6FC9',
                    backgroundColor: 'rgba(59, 111, 201, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'الهدف',
                    data: [3000, 3400, 3700, 4000, 4500],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    rtl: true,
                    labels: {
                        font: { family: 'Tajawal' },
                        padding: 15
                    }
                },
                tooltip: {
                    rtl: true,
                    titleFont: { family: 'Tajawal' },
                    bodyFont: { family: 'Tajawal' },
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toLocaleString('ar')} موظف`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { family: 'Tajawal' },
                        callback: function(value) {
                            return value.toLocaleString('ar');
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: { family: 'Tajawal' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// تحديث جميع الرسوم البيانية
function updateAllCharts(departmentData) {
    createDepartmentChart(departmentData || [
        { name: 'الموارد البشرية', count: 45 },
        { name: 'تقنية المعلومات', count: 78 },
        { name: 'المالية', count: 32 },
        { name: 'التسويق', count: 41 },
        { name: 'العمليات', count: 120 }
    ]);
    
    createPerformanceChart();
    createWorkforceChart(departmentData || [
        { name: 'الموارد البشرية', employee_count: 45 },
        { name: 'تقنية المعلومات', employee_count: 78 },
        { name: 'المالية', employee_count: 32 },
        { name: 'التسويق', employee_count: 41 },
        { name: 'العمليات', employee_count: 120 }
    ]);
    
    createGrowthChart();
}

// تهيئة الرسوم البيانية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // الانتظار قليلاً للتأكد من تحميل Canvas elements
    setTimeout(() => {
        updateAllCharts();
    }, 1000);
});



