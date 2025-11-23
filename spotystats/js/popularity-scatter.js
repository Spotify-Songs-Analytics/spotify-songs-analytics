let popularityScatterSvg, popXScale, popYScale;

function createPopularityScatter() {
    const margin = {top: 20, right: 120, bottom: 60, left: 70};
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    d3.select('#popularity-scatter').selectAll('*').remove();
    
    popularityScatterSvg = d3.select('#popularity-scatter')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Agregar dados por artista
    const artistData = d3.rollups(
        appState.filteredData,
        v => ({
            count: v.length,
            avgPopularity: d3.mean(v, d => d.popularity),
            genre: v[0].genre
        }),
        d => d.artist
    ).map(d => ({
        artist: d[0],
        count: d[1].count,
        popularity: d[1].avgPopularity,
        genre: d[1].genre
    })).filter(d => d.count > 0 && d.popularity > 0);
    
    // Escalas
    popXScale = d3.scaleLog()
        .domain([1, d3.max(artistData, d => d.popularity)])
        .range([0, width]);
    
    popYScale = d3.scaleLinear()
        .domain([0, d3.max(artistData, d => d.count)])
        .range([height, 0]);
    
    // Grid
    popularityScatterSvg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(popYScale)
            .tickSize(-width)
            .tickFormat(''));
    
    // Tooltip
    const tooltip = d3.select('#popularity-tooltip');
    
    // Círculos
    const circles = popularityScatterSvg.selectAll('circle')
        .data(artistData)
        .enter()
        .append('circle')
        .attr('cx', d => popXScale(d.popularity))
        .attr('cy', d => popYScale(d.count))
        .attr('r', 6)
        .attr('fill', d => genreColors[d.genre] || '#888')
        .attr('opacity', 0.7)
        .attr('stroke', '#0a0a0a')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('opacity', 1)
                .attr('r', 10)
                .attr('stroke-width', 2);
            
            tooltip
                .style('opacity', 1)
                .html(`
                    <strong>${d.artist}</strong><br>
                    Genre: ${d.genre}<br>
                    Songs: ${d.count}<br>
                    Avg Popularity: ${d.popularity.toFixed(1)}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('opacity', 0.7)
                .attr('r', 6)
                .attr('stroke-width', 1);
            
            tooltip.style('opacity', 0);
        });
    
    // Eixos
    popularityScatterSvg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(popXScale)
            .ticks(5)
            .tickFormat(d => d));
    
    popularityScatterSvg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(popYScale));
    
    // Labels
    popularityScatterSvg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 45)
        .attr('fill', '#B3B3B3')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('log(Popularity)');
    
    popularityScatterSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .attr('fill', '#B3B3B3')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Number of Songs');
    
    // Legenda com top genres
    const topGenres = [...new Set(artistData.map(d => d.genre))]
        .slice(0, 6);
    
    const legend = popularityScatterSvg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width + 15}, 0)`);
    
    topGenres.forEach((genre, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 22})`);
        
        legendRow.append('circle')
            .attr('cx', 6)
            .attr('cy', 6)
            .attr('r', 6)
            .attr('fill', genreColors[genre]);
        
        legendRow.append('text')
            .attr('x', 18)
            .attr('y', 10)
            .attr('fill', '#EDEDED')
            .style('font-size', '12px')
            .text(genre);
    });
}

function updatePopularityScatter() {
    createPopularityScatter();
}
