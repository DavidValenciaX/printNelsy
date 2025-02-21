function createCollage() {
    console.log("createCollage called.");
    const images = canvas.getObjects().filter(obj => obj.type === 'image' && obj !== marginRect && obj !== canvasBackground);
    console.log("Found images count:", images.length);
    if (images.length === 0) {
        console.log("No images found. Exiting createCollage.");
        return;
    }

    // Preserve selectable state and enable interaction
    images.forEach(img => {
        img.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true
        });
    });
    console.log("Updated images: selectable, evented, hasControls, and hasBorders set to true.");

    // Sort images by area (descending) to place larger images first
    images.sort((a, b) => (b.width * b.height) - (a.width * a.height));
    console.log("Images sorted by area (descending).");

    const padding = 20; // Spacing between images
    const availableWidth = marginRect.width;
    const availableHeight = marginRect.height;
    console.log("Available area - Width:", availableWidth, "Height:", availableHeight);

    // Determine the optimal number of columns
    let bestColumns = 1;
    let bestMaxHeight = Infinity;

    // Maximum possible columns based on minimum column width of 100px and available width
    const maxPossibleColumns = Math.min(
        images.length,
        Math.floor((availableWidth + padding) / (100 + padding))
    );
    console.log("Max possible columns:", maxPossibleColumns);

    for (let columns = 1; columns <= maxPossibleColumns; columns++) {
        console.log("Evaluating layout with", columns, "columns");
        const columnWidth = (availableWidth - (columns - 1) * padding) / columns;
        const colHeights = new Array(columns).fill(0);
        let maxHeight = 0;
        console.log("Column width:", columnWidth, "Initial colHeights:", colHeights);

        for (const [index, img] of images.entries()) {
            const minHeight = Math.min(...colHeights);
            const colIndex = colHeights.indexOf(minHeight);
            let currentHeight = colHeights[colIndex];
            let availableVerticalSpace = availableHeight - currentHeight;
            if (currentHeight > 0) {
                availableVerticalSpace -= padding;
            }

            // Calculate initial scale to fit column width
            let scaleFactor = columnWidth / img.width;
            let scaledHeight = img.height * scaleFactor;

            // Check if the image fits vertically
            if (scaledHeight > availableVerticalSpace) {
                scaleFactor = availableVerticalSpace / img.height;
                scaledHeight = availableVerticalSpace;
                // Ensure width doesn't exceed column width after vertical adjustment
                const scaledWidth = img.width * scaleFactor;
                if (scaledWidth > columnWidth) {
                    scaleFactor = columnWidth / img.width;
                    scaledHeight = img.height * scaleFactor;
                }
            }

            // Update column height
            let newHeight = currentHeight + scaledHeight;
            if (currentHeight > 0) {
                newHeight += padding;
            }
            colHeights[colIndex] = newHeight;
            if (newHeight > maxHeight) {
                maxHeight = newHeight;
            }
            console.log(`Image ${index}: colIndex ${colIndex}, scaleFactor: ${scaleFactor.toFixed(2)}, scaledHeight: ${scaledHeight.toFixed(2)}, newHeight: ${newHeight.toFixed(2)}, colHeights: ${colHeights}`);
        }

        console.log("For", columns, "columns, maxHeight =", maxHeight);
        if (maxHeight <= availableHeight) {
            if (columns > bestColumns || (columns === bestColumns && maxHeight < bestMaxHeight)) {
                bestColumns = columns;
                bestMaxHeight = maxHeight;
                console.log("New best layout found: columns =", bestColumns, "with maxHeight =", bestMaxHeight);
            }
        } else {
            if (maxHeight < bestMaxHeight || (maxHeight === bestMaxHeight && columns > bestColumns)) {
                bestColumns = columns;
                bestMaxHeight = maxHeight;
                console.log("New best layout found under overflow: columns =", bestColumns, "with maxHeight =", bestMaxHeight);
            }
        }
    }

    console.log("Final bestColumns:", bestColumns, "Final bestMaxHeight:", bestMaxHeight);

    // Use the best column count to layout the images
    const columns = bestColumns;
    const columnWidth = (availableWidth - (columns - 1) * padding) / columns;
    let colHeights = new Array(columns).fill(0);
    console.log("Laying out images with", columns, "columns, columnWidth:", columnWidth);

    images.forEach((img, index) => {
        const minHeight = Math.min(...colHeights);
        const colIndex = colHeights.indexOf(minHeight);
        let currentHeight = colHeights[colIndex];
        let availableVerticalSpace = availableHeight - currentHeight;
        if (currentHeight > 0) {
            availableVerticalSpace -= padding;
        }
        let scaleFactor = columnWidth / img.width;
        let scaledHeight = img.height * scaleFactor;
        if (scaledHeight > availableVerticalSpace) {
            scaleFactor = availableVerticalSpace / img.height;
            scaledHeight = availableVerticalSpace;
            const scaledWidth = img.width * scaleFactor;
            if (scaledWidth > columnWidth) {
                scaleFactor = columnWidth / img.width;
                scaledHeight = img.height * scaleFactor;
            }
        }
        // Calculate position
        const x = marginRect.left + colIndex * (columnWidth + padding) + columnWidth / 2;
        const y = marginRect.top + currentHeight + scaledHeight / 2;

        img.set({
            scaleX: scaleFactor,
            scaleY: scaleFactor,
            left: x,
            top: y,
            originX: 'center',
            originY: 'center',
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true
        }).setCoords();

        colHeights[colIndex] += scaledHeight + (currentHeight > 0 ? padding : 0);
        console.log(`Placed image ${index}: colIndex: ${colIndex}, scaleFactor: ${scaleFactor.toFixed(2)}, x: ${x.toFixed(2)}, y: ${y.toFixed(2)}, updated colHeights: ${colHeights}`);
    });

    canvas.renderAll();
    console.log("Collage layout complete.");
}