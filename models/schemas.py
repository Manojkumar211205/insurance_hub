from pydantic import BaseModel


class UserSignup(BaseModel):
    username: str
    email: str
    password: str


class UserSignin(BaseModel):
    email: str
    password: str


class InsuranceEntry(BaseModel):
    insurance_name: str
    insurance_date: str


class InsuranceRecord(BaseModel):
    userid: str
    insurance_obtained: list[InsuranceEntry]
