module Type
  DISCONNECT = 0
  MESSAGE = 1
  JSON = 2
  EVENT = 3
end

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

def generate_gid(length = 12)
  o = [(0..9), ('a'..'z'), (0..9)].map { |i| i.to_a }.flatten
  (0...length).map{ o[rand(o.length)] }.join
end
