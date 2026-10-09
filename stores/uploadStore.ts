import { defineStore } from "pinia";
import { useFirebaseStorage, useStorageFile } from "vuefire";
import { ref as storageRef, uploadBytes, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import moment from "moment";
export const uploadStore = defineStore('uploadStore', {
    state: () => {
        return {
            dialogupload: false,
            downloadUrl: '',
            progressUpload: 0,
            uploading: false,
            uploadEnd: false,
            namefile: '',
            urlRef: '',
            fileuploa: File,
            typefile: '',
            typefolder: '',
            dialogupload2: false,
            downloadUrl2: '',
            progressUpload2: 0,
            uploading2: false,
            uploadEnd2: false,
            namefile2: '',
            urlRef2: '',
            fileuploa2: File,
            typefile2: '',
        }
    },
    getters: {
        getUrlRef(state) {
            return state.urlRef
        },
        getUrlRef2(state) {
            return state.urlRef2
        },
        getprogressUpload(state) {
            return state.progressUpload
        },
        getprogressUpload2(state) {
            return state.progressUpload2
        },
        getDownloadUrl(state) {
            return state.downloadUrl
        },
        gedialogupload(state) {
            return state.dialogupload
        },
        getnamfile(state) {
            return state.namefile
        },
    },
    actions: {
        settypefolder(typefolder: string) {
            this.typefolder = typefolder
        },

        setReset() {
            this.dialogupload = false,
                this.downloadUrl = '',
                this.progressUpload = 0,
                this.uploading = false,
                this.uploadEnd = false,
                this.namefile = '',
                this.urlRef = '',
                this.fileupload = '',
                this.typefile = ''
        },

        setReset2() {
            this.dialogupload2 = false,
                this.downloadUrl2 = '',
                this.progressUpload2 = 0,
                this.uploading2 = false,
                this.uploadEnd2 = false,
                this.namefile2 = '',
                this.urlRef2 = '',
                this.fileupload2 = '',
                this.typefile2 = ''
        },

        setnameFile(item: any) {
            this.namefile = item
        },
        setfile(file: Blob) {
            this.fileupload = file
        },
        setTypeFile(item: any) {
            this.typefile = item
        },

        setnameFile2(item: any) {
            this.namefile2 = item
        },
        setfile2(file: Blob) {
            this.fileupload2 = file
        },
        setTypeFile2(item: any) {
            this.typefile2 = item
        },

        setUrlref(file: string) {
            this.urlRef = file
        },
        simpanFileAction(typefolder: string) {
            const loadingStore = useloadingStore()
            const picturestore = usePictureStore()
            const storage = useFirebaseStorage();
            const tahun = moment().format('YYYY');
            const bulan = moment().format('MM');
            const tanggal = moment().format('DD');
            return new Promise(async (resolve, reject) => {
                try {
                    var metadata = {
                        contentType: this.typefile,
                    };
                    loadingStore.setLoading(true)
                    const filenamaref = storageRef(storage, `upload/${tahun}/${bulan}/${tanggal}/${typefolder}/` + this.namefile);
                    const uploadTask = uploadBytesResumable(filenamaref, this.fileupload);

                    uploadTask.on('state_changed',
                        (snapshot) => {
                            // Observe state change events such as progress, pause, and resume
                            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            this.progressUpload = progress
                            // console.log('Upload is ' + progress + '% done');
                            switch (snapshot.state) {
                                case 'paused':
                                    // console.log('Upload is paused');
                                    break;
                                case 'running':
                                    // console.log('Upload is running');
                                    break;
                            }
                        },
                        (error) => {

                        },
                        () => {
                            // Handle successful uploads on complete
                            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                                this.urlRef = downloadURL
                                // console.log('File available at', downloadURL);
                            });
                            picturestore.setPic(this.downloadUrl)
                            loadingStore.setLoading(false)
                        })
                } catch (error) {
                    loadingStore.setLoading(false)
                    return reject(error)
                }
            })
        },
        simpanFileAction2(typefolder: string) {
            const loadingStore = useloadingStore()
            const picturestore = usePictureStore()
            const storage = useFirebaseStorage();
            const tahun = moment().format('YYYY');
            const bulan = moment().format('MM');
            const tanggal = moment().format('DD');
            return new Promise(async (resolve, reject) => {
                try {
                    var metadata = {
                        contentType: this.typefile,
                    };
                    loadingStore.setLoading(true)
                    const filenamaref = storageRef(storage, `upload/${tahun}/${bulan}/${tanggal}/${typefolder}/` + this.namefile2);
                    const uploadTask = uploadBytesResumable(filenamaref, this.fileupload2);

                    uploadTask.on('state_changed',
                        (snapshot) => {
                            // Observe state change events such as progress, pause, and resume
                            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            this.progressUpload2 = progress
                            // console.log('Upload is ' + progress + '% done');
                            switch (snapshot.state) {
                                case 'paused':
                                    // console.log('Upload is paused');
                                    break;
                                case 'running':
                                    // console.log('Upload is running');
                                    break;
                            }
                        },
                        (error) => {

                        },
                        () => {
                            // Handle successful uploads on complete
                            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                                this.urlRef2 = downloadURL
                                // console.log('File available at', downloadURL);
                            });
                            picturestore.setPic(this.downloadUrl2)
                            loadingStore.setLoading(false)
                        })
                } catch (error) {
                    loadingStore.setLoading(false)
                    return reject(error)
                }
            })
        },
    }

})



