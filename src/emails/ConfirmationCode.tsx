import * as React from "react";
import { Heading, Section, Text } from "@react-email/components";
import Starter from "./Starter";

export type ConfirmationCodeProps = React.JSX.IntrinsicAttributes & {
  confirmationCode: number;
};

const ConfirmationCode: React.FC<ConfirmationCodeProps> = ({
  confirmationCode = 123456,
}) => {
  const previewText = `Confirm your email for ammarahmed.ca. Code: ${confirmationCode}`;
  return (
    <Starter previewText={previewText}>
      <Heading className="text-black text-[24px] text-center font-normal p-0 my-[30px] mx-0">
        <strong>Confirm your email</strong>
      </Heading>
      <Text className="text-black text-[16px] font-normal p-0 mx-0">
        Your confirmation code is below, please enter it where prompted:
      </Text>
      <Section className="bg-gray-200 border border-gray border-gray-300 rounded p-4">
        <Text className="text-[32px] text-block font-bold tracking-[24px] text-center">
          {confirmationCode}
        </Text>
      </Section>
      <Text className="text-black text-[16px] font-normal text-center p-0 mx-0">
        The code expires in <strong>10 minutes</strong>.
      </Text>
      <Text className="text-black text-[12px] font-light text-center p-0 mx-0">
        If you did not register at ammarahmed.ca, you can safely disregard this
        message or contact me at ammar.ahmed2203@gmail.com.
      </Text>
    </Starter>
  );
};

export default ConfirmationCode;
