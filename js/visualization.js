document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    d3.json('data/welcome-index-data.json', (error, data) => {
        if (error) console.error(error);

        let visualization = d3.select('.visualization'),
            visualizationCountries = d3.select('.visualization__countries'),
            visualizationCountryDetailed = d3.select('.visualization__country-detailed'),
            maxWelcomeIndex = d3.max(data.countries.map(country => country.welcomeIndex)),
            colorScale = d3.scaleLinear()
                .domain([0, maxWelcomeIndex])
                .range(['white', '#ff0']);

        let countryText = visualizationCountries
            .selectAll('.visualization__country')
            .data(data.countries)
          .enter().append('div')
            .attr('class', 'visualization__country center-contents')
            .style('background-color', d => colorScale(d.welcomeIndex))
            .on('click', function(d) {
                // Create a clone of the clicked country.
                let countryFullSize = visualization.append('div')
                    .attr('class', 'country-full-size center-contents')
                    .style('position', 'absolute')
                    .style('top', this.offsetTop + 'px')
                    .style('left', this.offsetLeft + 'px')
                    .style('width', this.getBoundingClientRect().width + 'px')
                    .style('height', this.getBoundingClientRect().height + 'px')
                    .style('background-color', d3.select(this).style('background-color'))
                    .style('opacity', '1');

                countryFullSize.append('span')
                    .attr('class', 'visualization__country-text')
                    .text(() => d.country);

                countryFullSize.transition()
                    .duration(600)
                    .style('top', '0px')
                    .style('left', '0px')
                    .style('width', visualizationCountries.node().getBoundingClientRect().width + 'px')
                    .style('height', visualizationCountries.node().getBoundingClientRect().height + 'px')
                    .style('font-size', '48px')
                    .on('interrupt', function() {
                        d3.select(this).remove();
                    })
                    .on('end', function() {
                        visualizationCountries.style('opacity', '0');
                        d3.select(this).transition()
                            .style('opacity', '0')
                            .remove()
                            .on('interrupt', function() {
                                d3.select(this).remove();
                            })
                            .on('end', () => {
                                visualizationCountryDetailed.style('display', 'block')
                                  .transition()
                                    .on('interrupt', function() {
                                        d3.select(this).style('opacity', '0');
                                    })
                                    .style('opacity', '1');
                            });
                    });

                visualizationCountryDetailed.select('.country-name')
                    .text(() => d.country);
            })
            .append('span')
            .attr('class', 'visualization__country-text')
            .classed('visualization__country-text--hidden', true)
            .text(d => d.country);

        let visualizationSpace = document.querySelector('.visualization-space');
        let header = document.querySelector('.header');
        let headerHeight = header.getBoundingClientRect().height;
        let visualizationBecomesFullyVisible = () => {
            return visualizationSpace.getBoundingClientRect().top <= headerHeight && visualization.classed('visualization--in-the-background');
        };
        let visualizationIsNotFullyVisibleAnymore = () => {
            return visualizationSpace.getBoundingClientRect().top > headerHeight && !visualization.classed('visualization--in-the-background');
        };
        let checkPosition = () => {
            if (visualizationBecomesFullyVisible()) {
                countryText.classed('visualization__country-text--hidden', false);
                visualization.classed('visualization--in-the-background', false);
            } else if (visualizationIsNotFullyVisibleAnymore()) {
                let countryFullSize = d3.select('.country-full-size');
                if (!countryFullSize.empty()) {
                    countryFullSize.interrupt();
                } else {
                    countryText.classed('visualization__country-text--hidden', true);
                    visualization.classed('visualization--in-the-background', true);
                    visualizationCountryDetailed.transition()
                        .style('opacity', '0')
                        .on('interrupt', function() {
                            d3.select(this).style('opacity', '0');
                        })
                        .on('end', function() {
                            d3.select(this).style('display', 'none');
                            visualizationCountries.transition()
                                .style('opacity', '1');
                        });
                }
            }
        };
        document.addEventListener('scroll', checkPosition);
        window.addEventListener('load', checkPosition);
        window.addEventListener('resize', checkPosition);

        let backButton = document.querySelector('.back-button');
        backButton.addEventListener('click', () => {
            visualizationCountryDetailed.transition()
                .style('opacity', '0')
                .on('end', function() {
                    d3.select(this).style('display', 'none');
                    visualizationCountries.transition()
                        .style('opacity', '1');
                });
        });

        let toggleFiltersInformation = document.querySelector('#toggle-filters-information');
        let filtersInformation = document.querySelector('#filters-information');
        toggleFiltersInformation.addEventListener('click', () => {
            filtersInformation.classList.toggle('visualization__paragraph--hidden');
        });

        let inputRange = document.querySelector('.input-range');
        let inputRangeElement = document.querySelector('.input-range__element');
        let getInputRangeWidth = () => {
            let width = window.getComputedStyle(inputRange).width;
            return +width.substring(0, width.length - 2);  // Remove 'px' unit.
        };

        const INPUT_RANGE_AXIS_OFFSET = 20;
        const THUMB_WIDTH = 30;  // Value set in CSS.
        let svg = {
            width: getInputRangeWidth() + INPUT_RANGE_AXIS_OFFSET*2,
            height: 20,
            margin: {
                left: INPUT_RANGE_AXIS_OFFSET + THUMB_WIDTH/2,
                right: 20 + THUMB_WIDTH/2
            }
        };

        let age = ['15-24', '25-34', '35-44', '45-54', '55-64', '65+'];
        let education = ['low', 'average', 'high'];
        let income = ['low', 'average', 'high', 'DK/NA'];
        let communitySize = ['Less than 1,000', '1,000 - 4.999', '5,000 - 9,999', '10,000 - 99,999', '100,000 - 499,999', '500,000 - 1,000,000', 'Greater than 1,000,000'];

        let scale = d3.scalePoint()
            .domain(age)
            .range([0, svg.width - svg.margin.left - svg.margin.right]);

        svg.svg = d3.select('.input-range')
            .append('svg')
            .attr('class', 'input-range__axis')
            .attr('width', svg.width)
            .attr('height', svg.height)
            .style('position', 'relative')
            .style('left', '-' + INPUT_RANGE_AXIS_OFFSET + 'px')
            .append('g');

        var axis = svg.svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + svg.margin.left + ', 0)')
            .call(d3.axisBottom(scale));

        let filterPicker = document.querySelector('#filter-picker');
        filterPicker.addEventListener('change', function() {
            let filter;
            if (this.value === 'age') {
                filter = age;
            } else if (this.value === 'education') {
                filter = education;
            } else if (this.value === 'income') {
                filter = income;
            } else if (this.value === 'community-size') {
                filter = communitySize;
            }
            inputRangeElement.value = 0;
            inputRangeElement.max = filter.length - 1;
            scale.domain(filter);
            axis.transition().call(d3.axisBottom(scale));
        });

        let newColorScale = d3.scaleLinear()
            .domain([0, 100])
            .range(['white', '#ff0']);

        d3.select('.visualization-local__country')
            .style('position', 'relative')
            .style('top', '100px')
            .style('left', '-200px')
            .style('width', '200px')
            .style('height', '200px')
            .style('background-color', colorScale(70))
          .append('span')
            .style('position', 'absolute')
            .style('right', '20px')
            .style('bottom', '-14px')
            .style('font-size', '36px')
            .style('z-index', '1')
            .text('70%');

        d3.select('.visualization-local__city')
            .style('position', 'relative')
            .style('top', '-40px')
            .style('left', '-50px')
            .style('width', '200px')
            .style('height', '200px')
            .style('background-color', colorScale(40))
          .append('span')
            .style('position', 'absolute')
            .style('top', '20px')
            .style('right', '-10px')
            .style('font-size', '36px')
            .style('z-index', '1')
            .text('40%');

        d3.select('.visualization-local__neighborhood')
            .style('position', 'relative')
            .style('top', '-80px')
            .style('left', '-100px')
            .style('width', '200px')
            .style('height', '200px')
            .style('background-color', colorScale(8))
          .append('span')
            .style('position', 'absolute')
            .style('left', '-10px')
            .style('bottom', '10px')
            .style('font-size', '36px')
            .style('z-index', '1')
            .text('8%');
    });
});
