import * as React from "react";
import Starter from "./Starter";
import { Heading, Text } from "@react-email/components"

export type PlayerRegisteredProps = React.JSX.IntrinsicAttributes & {
  firstName: string,
  lastName: string
  middleName?: string,
  email: string,
  company?: string,
  position?: string,
  foundBy?: string
}

const PlayerRegistered: React.FC<PlayerRegisteredProps> = ({
  firstName = "Saniya",
  lastName = "Ahmed",
  middleName,
  email = "saniya.ahmedd1@gmail.com",
  company = "Popeyes",
  position = "Cashier",
  foundBy = "LinkedIn"
}) => {
  const previewText = `New player (${firstName} ${lastName}) registered for ammarahmed.ca`
  return (
    <Starter previewText={previewText}>
      <Heading className="text-black text-[24px] text-center font-normal p-0 my-[30px] mx-0">
        <strong>Player registered</strong>
      </Heading>
      <Text className="text-black text-[16px] font-normal p-0 mx-0">
        A new player registered!
      </Text>
      <Text className="text-black text-[16px] font-normal p-0 mx-0">
        Details:
        <ul style={{ lineHeight: "30px" }}>
          <li><strong>Name</strong>: {firstName} {middleName} {lastName}</li>
          <li><strong>Email</strong>: {email}</li>
          {company && (
            <li><strong>Company</strong>: {company}</li>
          )}
          {position && (
            <li><strong>Position</strong>: {position}</li>
          )}
          {foundBy && (
            <li><strong>Found By</strong>: {foundBy}</li>
          )}
        </ul>
      </Text>
    </Starter>
  )
}

export default PlayerRegistered;