const chooseImageBtn = document.getElementById("choose_image");
const imageInput = document.getElementById("image_input");



chooseImageBtn.addEventListener("click", () => {
    imageInput.click();
});




imageInput.addEventListener("change", async () => {
    if (!imageInput.files || imageInput.files.length === 0) return;
    const file = imageInput.files[0];

    const compressed = await compressTo2MB(file);

    if (compressed.size > MAX_BYTES) {
        alert("Could not compress below 2MB.");
        return;
    }

    const arrayBuffer = await compressed.arrayBuffer();

    socket.emit("chat_image", {
        name: nameInput.value,
        type: "image/jpeg",
        image: arrayBuffer
    });
});



const MAX_BYTES = 2 * 1024 * 1024;

async function compressTo2MB(file) {
    let quality = 0.9;
    let maxWidth = 600;

    let blob = await compressOnce(file, maxWidth, quality);

    while (blob.size > MAX_BYTES) {

        if (maxWidth > 500) maxWidth -= 150;

        // reduce quality
        if (quality > 0.3) quality -= 0.1;

        blob = await compressOnce(blob, maxWidth, quality);

        // safety break (prevents infinite loops)
        if (maxWidth <= 500 && quality <= 0.3) break;
    }

    return blob;
}

function compressOnce(fileOrBlob, maxWidth, quality) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => (img.src = e.target.result);
        reader.readAsDataURL(fileOrBlob);

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            let scale = Math.min(1, maxWidth / img.width);

            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (blob) => resolve(blob),
                "image/jpeg",
                quality
            );
        };

        img.onerror = reject;
    });
}
