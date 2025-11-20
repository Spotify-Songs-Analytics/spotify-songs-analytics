let selectedArtistForSongs = null;

function createArtistSongsView(artistName) {
    selectedArtistForSongs = artistName;
    
    const container = d3.select('#artist-songs-container');
    container.selectAll('*').remove();
    
    if (!artistName) {
        container.append('p')
            .style('color', '#B3B3B3')
            .style('text-align', 'center')
            .style('padding', '20px')
            .text('Select an artist from the radar chart above to see their songs');
        return;
    }
    
    // Filtrar músicas do artista
    const artistSongs = appState.data
        .filter(d => d.artist === artistName)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 20); // Top 20 músicas
    
    if (artistSongs.length === 0) {
        container.append('p')
            .style('color', '#B3B3B3')
            .style('text-align', 'center')
            .style('padding', '20px')
            .text(`No songs found for ${artistName}`);
        return;
    }
    
    // Header
    const header = container.append('div')
        .style('margin-bottom', '20px')
        .style('padding', '15px')
        .style('background', 'rgba(29, 185, 84, 0.1)')
        .style('border-radius', '8px')
        .style('border-left', '4px solid #1DB954');
    
    header.append('h3')
        .style('color', '#1DB954')
        .style('margin', '0 0 8px 0')
        .style('font-size', '20px')
        .text(artistName);
    
    header.append('p')
        .style('color', '#B3B3B3')
        .style('margin', '0')
        .style('font-size', '14px')
        .text(`${artistSongs.length} songs • Sorted by popularity`);
    
    // Container de músicas
    const songsContainer = container.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', 'repeat(auto-fit, minmax(400px, 1fr))')
        .style('gap', '16px')
        .style('margin-top', '20px');
    
    // Criar card para cada música
    artistSongs.forEach((song, index) => {
        const songCard = songsContainer.append('div')
            .style('background', 'rgba(42, 42, 42, 0.5)')
            .style('border', '1px solid #3A3A3A')
            .style('border-radius', '8px')
            .style('padding', '16px')
            .style('transition', 'all 0.3s ease')
            .on('mouseover', function() {
                d3.select(this)
                    .style('border-color', '#1DB954')
                    .style('transform', 'translateY(-2px)')
                    .style('box-shadow', '0 4px 12px rgba(29, 185, 84, 0.2)');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .style('border-color', '#3A3A3A')
                    .style('transform', 'translateY(0)')
                    .style('box-shadow', 'none');
            });
        
        // Header da música
        const songHeader = songCard.append('div')
            .style('display', 'flex')
            .style('justify-content', 'space-between')
            .style('align-items', 'flex-start')
            .style('margin-bottom', '12px');
        
        const songInfo = songHeader.append('div')
            .style('flex', '1');
        
        songInfo.append('div')
            .style('color', '#EDEDED')
            .style('font-size', '16px')
            .style('font-weight', '600')
            .style('margin-bottom', '4px')
            .text(song.name.length > 35 ? song.name.substring(0, 35) + '...' : song.name);
        
        songInfo.append('div')
            .style('color', '#B3B3B3')
            .style('font-size', '12px')
            .text(`${song.year} • ${song.genre}`);
        
        songHeader.append('div')
            .style('background', 'rgba(29, 185, 84, 0.2)')
            .style('color', '#1DB954')
            .style('padding', '4px 10px')
            .style('border-radius', '12px')
            .style('font-size', '13px')
            .style('font-weight', '600')
            .text(`${song.popularity}%`);
        
        // Métricas com barras
        const metrics = [
            {name: 'Energy', value: song.energy, color: '#00FF00'},
            {name: 'Danceability', value: song.danceability, color: '#00CED1'},
            {name: 'Valence', value: song.valence, color: '#FF4500'},
            {name: 'Acousticness', value: song.acousticness, color: '#FF69B4'}
        ];
        
        const metricsContainer = songCard.append('div')
            .style('margin-top', '12px');
        
        metrics.forEach(metric => {
            const metricRow = metricsContainer.append('div')
                .style('margin-bottom', '8px');
            
            metricRow.append('div')
                .style('display', 'flex')
                .style('justify-content', 'space-between')
                .style('margin-bottom', '4px')
                .html(`
                    <span style="color: #B3B3B3; font-size: 12px;">${metric.name}</span>
                    <span style="color: #EDEDED; font-size: 12px; font-weight: 600;">${(metric.value * 100).toFixed(0)}%</span>
                `);
            
            const barContainer = metricRow.append('div')
                .style('width', '100%')
                .style('height', '6px')
                .style('background', 'rgba(255, 255, 255, 0.1)')
                .style('border-radius', '3px')
                .style('overflow', 'hidden');
            
            barContainer.append('div')
                .style('width', '0%')
                .style('height', '100%')
                .style('background', metric.color)
                .style('border-radius', '3px')
                .style('transition', 'width 0.5s ease')
                .transition()
                .duration(800)
                .delay(index * 50)
                .style('width', (metric.value * 100) + '%');
        });
    });
}

function updateArtistSongsView() {
    if (selectedArtistForSongs) {
        createArtistSongsView(selectedArtistForSongs);
    }
}
