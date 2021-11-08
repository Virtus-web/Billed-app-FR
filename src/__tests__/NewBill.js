import {screen, fireEvent, waitForElementToBeRemoved} from "@testing-library/dom"
import { localStorageMock } from "../__mocks__/localStorage.js"
import firebase from "../__mocks__/firebase"
import firestore from "../app/Firestore"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import NewBillUI from "../views/NewBillUI.js"
import BillsUI from "../views/BillsUI.js"
import NewBill from "../containers/NewBill.js"

jest.mock("../app/Firestore")

//Test de la fonctionnalité de téléchargement des justificatifs en format image
describe("Given I am connected as an employee", () => {
    describe("When I am on NewBill Page and I add an image file", () => {
        test("Then this new file should have been changed in the input file", () => {
            const html = NewBillUI()
            document.body.innerHTML = html
            //to-do write assertion
            
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname })
            }

            Object.defineProperty(window, "localStorage", {value: localStorageMock})
            window.localStorage.setItem("user", JSON.stringify({type: "Employee"}))

            const newBill = new NewBill({
                document,
                onNavigate,
                firestore: null,
                localStorage: window.localStorage,
            })

            const handleChangeFile = jest.fn(newBill.handleChangeFile)
            const inputFile = screen.getByTestId("file")
            inputFile.addEventListener("change", handleChangeFile)
            fireEvent.change(inputFile, {target: {files: [new File(["image.png"], "image.png", { type: "image/png" })]}})
            expect(handleChangeFile).toHaveBeenCalled()
            expect(inputFile.files[0].name).toBe("image.png")
        })
    })
})

//Test de la fonctionnalité de téléchargement des justificatifs en format autre que image
describe("Given I am connected as an employee", () => {
    describe("When I am on NewBill Page and I add a file other than an image (jpg, jpeg or png)", () => {
        test("Then, the bill shouldn't be created and I stay on the NewBill page", () => {

            const html = NewBillUI()
            document.body.innerHTML = html
            
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname })
            }

            Object.defineProperty(window, "localStorage", {value: localStorageMock})
            window.localStorage.setItem("user", JSON.stringify({type: "Employee"}))

            const firestore = null
            const newBill = new NewBill({
                document,
                onNavigate,
                firestore,
                localStorage: window.localStorage
            })

            const handleSubmit = jest.fn(newBill.handleSubmit)
            newBill.fileName = "invalid"

            const submitBtn = screen.getByTestId("form-new-bill")
            submitBtn.addEventListener("submit", handleSubmit)
            fireEvent.submit(submitBtn)
            expect(handleSubmit).toHaveBeenCalled()
            expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy()
        })
    })
})

//Test de la fonctionnalité de création d'une nouvelle note de frais
describe("Given I am connected as an employee", () => {
    describe("When I am on NewBill Page and I submit the form width an image (jpg, jpeg, png)", () => {
        test("Then it should create a new bill", () => {

            const html = NewBillUI()
            document.body.innerHTML = html

            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname })
            }
            
            Object.defineProperty(window, "localStorage", {value: localStorageMock})
            window.localStorage.setItem("user", JSON.stringify({type: "Employee"}))

            const firestore = null
            const newBill = new NewBill({
                document,
                onNavigate,
                firestore,
                localStorage: window.localStorage
            })

            const handleSubmit = jest.fn(newBill.handleSubmit)
            const submitBtn = screen.getByTestId("form-new-bill")
            submitBtn.addEventListener("submit", handleSubmit)
            fireEvent.submit(submitBtn)
            expect(handleSubmit).toHaveBeenCalled()
        })
    })
})


// test d'intégration POST basé sur Dashboard.js avec un test concret en plus
describe("Given I am a user connected as Employee", () => {
    describe("When I create a new bill", () => {
        test("Add bill to mock API POST", async () => {

            const getSpyPost = jest.spyOn(firebase, "post")


            const newBill = {
            "id": "qcCK3SzECmaZAGReggyrgy",
                "status": "refused",
                "pct": 20,
                "amount": 200,
                "email": "a@a",
                "name": "test33",
                "vat": "40",
                "fileName": "preview-facture-free-201801-pdf-1.jpg",
                "date": "2002-02-02",
                "commentAdmin": "pas la bonne facture",
                "commentary": "test2",
                "type": "Restaurants et bars",
                "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=4df6ed2c-12c8-42a2-b013-346c1346f732"
            }

            const bills = await firebase.post(newBill)
            expect(getSpyPost).toHaveBeenCalledTimes(1)
            expect(bills.data.length).toBe(5)
        })
        test("Add bill to API and fails with 404 message error", async () => {

            firebase.post.mockImplementationOnce(() =>
                Promise.reject(new Error("Erreur 404"))
            )
            const html = BillsUI({ error: "Erreur 404" })
            document.body.innerHTML = html
            const message = await screen.getByText(/Erreur 404/)
            expect(message).toBeTruthy()
        })
        test("Add bill to API and fails with 500 message error", async () => {
            
            firebase.post.mockImplementationOnce(() =>
                Promise.reject(new Error("Erreur 500"))
            )
            const html = BillsUI({ error: "Erreur 500" })
            document.body.innerHTML = html
            const message = await screen.getByText(/Erreur 500/)
            expect(message).toBeTruthy()
        })
    })
})