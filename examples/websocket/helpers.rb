def unpack_message payload
  data = JSON.parse(payload)
end

def pack_message type, payload, extra=nil, channel=nil
  payload = case type
            when Type::DISCONNECT
            when Type::MESSAGE
              payload
            when Type::JSON
              payload.to_json
            when Type::EVENT
              {name: payload, data: extra}
            end

  return {type: type, data: payload, channel: channel}.to_json
end

