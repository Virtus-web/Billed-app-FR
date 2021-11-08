import { screen, fireEvent } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import { localStorageMock } from "../__mocks__/localStorage.js"
import firebase from "../__mocks__/firebase"
import Firestore from "../app/Firestore"
import { bills } from "../fixtures/bills.js"
import Router from "../app/Router"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import Bills from "../containers/Bills.js"
import BillsUI from "../views/BillsUI.js"

//Test pour vérifier le style de l'icône de facture
describe("Given I am connected as an employee", () => {
    describe("When I am on Bills Page", () => {
        test("Then bill icon in vertical layout should be highlighted", () => {
            const html = BillsUI({ data: []})
            document.body.innerHTML = html
            //to-do write expect expression

            Object.defineProperty(window, "localStorage", {value: localStorageMock})
            window.localStorage.setItem("user", JSON.stringify({type: "Employee"}))

            jest.mock("../app/Firestore")
            Firestore.bills = () => ({ bills, get: jest.fn().mockResolvedValue() })

            const pathname = ROUTES_PATH["Bills"]
            Object.defineProperty(window, "location", { value: { hash: pathname } })
            document.body.innerHTML = `<div id="root"></div>`

            Router()
            expect(screen.getByTestId("icon-window").classList.contains("active-icon")).toBe(true)
        })

        test("Then bills should be ordered from earliest to latest", () => {
            const html = BillsUI({ data: bills })
            document.body.innerHTML = html
            const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
            const antiChrono = (a, b) => ((a < b) ? 1 : -1)
            const datesSorted = [...dates].sort(antiChrono)
            expect(dates).toEqual(datesSorted)
        })
    })
})

//Test pour la focntionnalité "Nouvelle note de frais"
describe("Given I am connected as Employee and I am on Bills page", () => {
    describe("When I click on the New Bill button", () => {
        test("Then, it should render NewBill page", () => {

            const html = BillsUI({ data: [] })
            document.body.innerHTML = html

            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname })
            }

            Object.defineProperty(window, "localStorage", {value: localStorageMock})
            window.localStorage.setItem("user", JSON.stringify({type: "Employee"}))

            const firestore = null
            const bills = new Bills({
                document,
                onNavigate,
                firestore,
                localStorage: window.localStorage
            })

            const handleClickNewBill = jest.fn(bills.handleClickNewBill)

            const billBtn = screen.getByTestId("btn-new-bill")
            billBtn.addEventListener("click", handleClickNewBill)
            fireEvent.click(billBtn)
            expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy()
        })
    })
})
*//Test pour la fonctionnalité de visualisation du justificatif
describe("Given I am connected as Employee and I am on Bills page", () => {
    describe("When I click on the icon eye", () => {
        test("A modal should open", () => {

        const html = BillsUI({ data: bills })
        document.body.innerHTML = html

        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
        }

        Object.defineProperty(window, "localStorage", {value: localStorageMock})
        window.localStorage.setItem("user", JSON.stringify({type: "Employee"}))

        const firestore = null
        const mybills = new Bills({
            document,
            onNavigate,
            firestore,
            localStorage: window.localStorage
        })

        $.fn.modal = jest.fn()

        const handleClickIconEyeMock = jest.fn(() => mybills.handleClickIconEye(eye))
        
        const eye = screen.getAllByTestId("icon-eye")[0]
        eye.addEventListener("click", handleClickIconEyeMock)
        fireEvent.click(eye)
        expect(handleClickIconEyeMock).toHaveBeenCalled()

        const modale = document.getElementById("modaleFile")
        expect(modale).toBeTruthy()
        })
    })
})


// test d'intégration GET basé sur Dashboard.js
describe("Given I am a user connected as Employee", () => {
    describe("When I navigate to Bills UI", () => {
        test("fetches bills from mock API GET", async () => {
            const getSpy = jest.spyOn(firebase, "get")
            const bills = await firebase.get()
            expect(getSpy).toHaveBeenCalledTimes(1)
            expect(bills.data.length).toBe(4)
        })

        test("fetches bills from an API and fails with 404 message error", async () => {
            firebase.get.mockImplementationOnce(() =>
                Promise.reject(new Error("Erreur 404"))
            )
            const html = BillsUI({ error: "Erreur 404" })
            document.body.innerHTML = html
            const message = await screen.getByText(/Erreur 404/)
            expect(message).toBeTruthy()
        })
        
        test("fetches messages from an API and fails with 500 message error", async () => {
            firebase.get.mockImplementationOnce(() =>
                Promise.reject(new Error("Erreur 500"))
            )
            const html = BillsUI({ error: "Erreur 500" })
            document.body.innerHTML = html
            const message = await screen.getByText(/Erreur 500/)
            expect(message).toBeTruthy()
        })
    })
})
