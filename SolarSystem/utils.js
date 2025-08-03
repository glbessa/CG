async function loadAsset(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download asset: ${response.statusText}`);
    }
    return await response.text();
}

export { loadAsset };