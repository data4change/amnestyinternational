document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    d3.json('data/welcome-index-data.json', (error, data) => {
        if (error) console.error(error);

        let visualization = d3.select('.visualization'),
            visualizationCountries = d3.select('.visualization__countries'),
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
                    .attr('class', 'center-contents')
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
                    .duration(750)
                    .style('top', '0px')
                    .style('left', '0px')
                    .style('width', visualizationCountries.node().getBoundingClientRect().width + 'px')
                    .style('height', visualizationCountries.node().getBoundingClientRect().height + 'px')
                    .style('font-size', '48px')
                    .on('end', function() {
                        visualizationCountries.style('opacity', '0');
                        d3.select(this).transition()
                            .duration(500)
                            .style('opacity', '0');
                    });
            })
            .append('span')
            .attr('class', 'visualization__country-text')
            .classed('visualization__country-text--hidden', true)
            .text(d => d.country);

        let visualizationSpace = document.querySelector('.visualization-space');
        let header = document.querySelector('.header');
        let headerHeight = header.getBoundingClientRect().height;
        let checkPosition = () => {
            let visualizationSpaceTop = visualizationSpace.getBoundingClientRect().top;
            if (visualizationSpaceTop <= headerHeight) {
                countryText.classed('visualization__country-text--hidden', false);
                visualization.style('z-index', 0);
            } else {
                countryText.classed('visualization__country-text--hidden', true);
                visualization.style('z-index', -1);
            }
        };
        document.addEventListener('scroll', checkPosition);
        window.addEventListener('load', checkPosition);
    });
});
